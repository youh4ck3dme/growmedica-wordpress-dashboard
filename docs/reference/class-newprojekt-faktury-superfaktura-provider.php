<?php
/**
 * REFERENCE ONLY — do NOT install as a WordPress plugin.
 *
 * Source: su-fakktura / newprojekt-faktury (API pattern sample).
 * GrowMedica production uses official `woocommerce-superfaktura` on cms.
 *
 * Useful patterns:
 * - Basic Auth: base64(email:api_key)
 * - POST https://moja.superfaktura.sk/api/invoices/add
 * - GET  https://moja.superfaktura.sk/api/invoices/view/{id}
 *
 * See: docs/reference/superfaktura-api-pattern.md
 *      docs/SUPERFAKTURA_SETUP.md
 */
if (!defined('ABSPATH')) {
    // Allow reading this file outside WP as documentation sample.
}

/**
 * Provider pre export faktúr do SuperFaktúra.sk
 */
class Newprojekt_Faktury_Superfaktura_Provider
{

    /**
     * @var string
     */
    private $api_key;

    /**
     * @var string
     */
    private $email;

    public function __construct()
    {
        $options = get_option('newprojekt_faktury_settings', array());

        $this->api_key = isset($options['superfaktura_api_key']) ? trim($options['superfaktura_api_key']) : '';
        $this->email = isset($options['superfaktura_email']) ? trim($options['superfaktura_email']) : '';
    }

    /**
     * Exportuje faktúru do SuperFaktúry.
     *
     * @param int $invoice_id ID CPT faktúry.
     * @return bool
     */
    public function exportInvoice($invoice_id)
    {
        $invoice_id = (int) $invoice_id;

        if (empty($this->api_key) || empty($this->email)) {
            error_log('Newprojekt_Faktury_Superfaktura_Provider: API credentials are not set.');
            return false;
        }

        if (!$invoice_id) {
            error_log('Newprojekt_Faktury_Superfaktura_Provider: Missing invoice ID.');
            return false;
        }

        // Dáta faktúry z interného systému (CPT)
        $invoice_data = Newprojekt_Faktury()->pdf_generator->get_invoice_data_for_pdf($invoice_id);

        if (!$invoice_data || !is_array($invoice_data)) {
            error_log('Newprojekt_Faktury_Superfaktura_Provider: Could not retrieve invoice data (ID: ' . $invoice_id . ').');
            return false;
        }

        // Príprava dát do formátu API
        $sf_data = $this->prepare_superfaktura_data($invoice_data);

        // ENDPOINT – podľa aktuálnej dokumentácie si môžeš endpoint upraviť
        $api_endpoint = 'https://moja.superfaktura.sk/api/invoices/add';

        $headers = array(
            'Content-Type' => 'application/json; charset=utf-8',
            // SuperFaktúra bežne používa Basic Auth (email:api_key)
            'Authorization' => 'Basic ' . base64_encode($this->email . ':' . $this->api_key),
        );

        $response = wp_remote_post(
            $api_endpoint,
            array(
                'headers' => $headers,
                'body' => wp_json_encode($sf_data),
                'method' => 'POST',
                'timeout' => 45,
                'redirection' => 5,
                'httpversion' => '1.0',
                'blocking' => true,
                'data_format' => 'body',
            )
        );

        if (is_wp_error($response)) {
            error_log('Newprojekt_Faktury_Superfaktura_Provider: API Error: ' . $response->get_error_message());
            return false;
        }

        $body = wp_remote_retrieve_body($response);
        $data = json_decode($body, true);

        // Tu si podľa reálnej odpovede z SF doladíš logiku (status / success / error)
        if (!isset($data['status']) || 'success' !== strtolower($data['status'])) {
            error_log(
                sprintf(
                    'Newprojekt_Faktury_Superfaktura_Provider: Export failed for invoice ID %d. Response: %s',
                    $invoice_id,
                    $body
                )
            );
            return false;
        }

        // Uloženie ID faktúry zo SuperFaktúry (ak je k dispozícii)
        if (isset($data['invoice_id'])) {
            update_post_meta($invoice_id, '_newprojekt_faktury_sf_invoice_id', sanitize_text_field($data['invoice_id']));
        }

        return true;
    }

    /**
     * Zistí stav faktúry v SuperFaktúre.
     *
     * @param int $invoice_id
     * @return string 'zaplatená', 'odoslana', 'po splatnosti', '' atď.
     */
    public function getInvoiceStatus($invoice_id)
    {
        $invoice_id = (int) $invoice_id;
        $sf_invoice_id = get_post_meta($invoice_id, '_newprojekt_faktury_sf_invoice_id', true);

        if (empty($sf_invoice_id)) {
            return '';
        }

        if (empty($this->api_key) || empty($this->email)) {
            return '';
        }

        $api_endpoint = 'https://moja.superfaktura.sk/api/invoices/view/' . urlencode($sf_invoice_id);

        $headers = array(
            'Authorization' => 'Basic ' . base64_encode($this->email . ':' . $this->api_key),
        );

        $response = wp_remote_get(
            $api_endpoint,
            array(
                'headers' => $headers,
                'timeout' => 45,
            )
        );

        if (is_wp_error($response)) {
            error_log('Newprojekt_Faktury_Superfaktura_Provider: Status check error: ' . $response->get_error_message());
            return '';
        }

        $body = wp_remote_retrieve_body($response);
        $data = json_decode($body, true);

        if (!isset($data['invoice']['status'])) {
            return '';
        }

        $sf_status = $data['invoice']['status'];

        // Vnútorné nastavenia – napr. počet dní po splatnosti
        $options = get_option('newprojekt_faktury_settings', array());
        $overdue_days = isset($options['overdue_days']) ? (int) $options['overdue_days'] : 14;
        $due_date_meta = get_post_meta($invoice_id, '_newprojekt_faktury_due_date', true);
        $is_overdue = false;

        if (!empty($due_date_meta) && $overdue_days > 0) {
            $due_ts = strtotime($due_date_meta);
            if ($due_ts && $due_ts < strtotime('-' . $overdue_days . ' days')) {
                $is_overdue = true;
            }
        }

        // Mapovanie stavov zo SF na naše interné
        switch ($sf_status) {
            case 'Zaplatena':
            case 'Paid':
                return 'zaplatená';

            case 'Nezaplatena':
            case 'Unpaid':
                return $is_overdue ? 'po splatnosti' : 'odoslana';

            default:
                return strtolower($sf_status);
        }
    }

    /**
     * Pripraví dáta faktúry do formátu prijateľného pre SuperFaktúru.
     *
     * @param array $invoice_data
     * @return array
     */
    private function prepare_superfaktura_data($invoice_data)
    {
        $company_options = Newprojekt_Faktury()->settings->get_company_details();

        $items = isset($invoice_data['items']) && is_array($invoice_data['items']) ? $invoice_data['items'] : array();
        $subtotal = 0;
        $vat_total = 0;

        foreach ($items as $item) {
            $qty = isset($item['quantity']) ? (float) $item['quantity'] : 1;
            $unit_price = isset($item['unit_price']) ? (float) $item['unit_price'] : 0;
            $tax_rate = isset($item['tax_rate']) ? (float) $item['tax_rate'] : 0;

            $item_subtotal = $qty * $unit_price;
            $subtotal += $item_subtotal;
            $vat_total += $item_subtotal * ($tax_rate / 100);
        }

        $total = $subtotal + $vat_total;

        $sf_data = array(
            // Hlavné polia faktúry – názov, popis
            'nazov' => 'Faktúra ' . ($invoice_data['invoice_number'] ?? ''),
            'popis' => 'Automaticky generovaná faktúra z WordPress pluginu NEWPROJEKT FAKTURY.',

            // Sumár
            'cena' => number_format($total, 2, '.', ''),
            'mena' => 'EUR',
            'dph' => number_format($vat_total, 2, '.', ''),

            // Meta
            'poznamka' => 'Variabilný symbol: ' . ($invoice_data['variable_symbol'] ?? ''),

            // Odberateľ
            'email' => $invoice_data['client_email'] ?? '',
            'meno' => $invoice_data['client_name'] ?? '',
            'adresa' => $invoice_data['client_address'] ?? '',
            'splatnost' => $invoice_data['due_date'] ?? '',

            // Položky
            'polozky' => array(),

            // Voliteľné
            'automaticke_vystavenie' => true,

            // Dodávateľ (tvoja firma)
            'firma' => array(
                'nazov' => $company_options['name'] ?? '',
                'adresa' => $company_options['address'] ?? '',
                'ico' => $company_options['ico'] ?? '',
                'dic' => $company_options['dic'] ?? '',
                'ic_dph' => $company_options['ic_dph'] ?? '',
            ),
        );

        foreach ($items as $item) {
            $sf_data['polozky'][] = array(
                'nazov' => $item['name'] ?? '',
                'mnozstvo' => (float) ($item['quantity'] ?? 1),
                'cena' => number_format((float) ($item['unit_price'] ?? 0), 2, '.', ''),
                'dph' => (float) ($item['tax_rate'] ?? 0),
            );
        }

        /**
         * Filter na úpravu dát pred odoslaním do SuperFaktúry.
         *
         * @param array $sf_data
         * @param array $invoice_data
         */
        return apply_filters('newprojekt_faktury_superfaktura_export_data', $sf_data, $invoice_data);
    }
}
