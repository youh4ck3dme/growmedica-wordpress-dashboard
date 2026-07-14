/**
 * Shopify Storefront API — GraphQL Queries
 */

// ─── Fragments ────────────────────────────────────────────────────────────────

export const IMAGE_FRAGMENT = /* GraphQL */ `
  fragment ImageFragment on Image {
    id
    url
    altText
    width
    height
  }
`

export const MONEY_FRAGMENT = /* GraphQL */ `
  fragment MoneyFragment on MoneyV2 {
    amount
    currencyCode
  }
`

export const PRODUCT_VARIANT_FRAGMENT = /* GraphQL */ `
  ${MONEY_FRAGMENT}
  fragment ProductVariantFragment on ProductVariant {
    id
    title
    availableForSale
    quantityAvailable
    sku
    selectedOptions {
      name
      value
    }
    price {
      ...MoneyFragment
    }
    compareAtPrice {
      ...MoneyFragment
    }
    image {
      url
      altText
      width
      height
    }
  }
`

export const PRODUCT_LIST_ITEM_FRAGMENT = /* GraphQL */ `
  ${MONEY_FRAGMENT}
  fragment ProductListItemFragment on Product {
    id
    handle
    title
    vendor
    productType
    tags
    availableForSale
    priceRange {
      minVariantPrice { ...MoneyFragment }
      maxVariantPrice { ...MoneyFragment }
    }
    compareAtPriceRange {
      minVariantPrice { ...MoneyFragment }
      maxVariantPrice { ...MoneyFragment }
    }
    featuredImage {
      url
      altText
      width
      height
    }
    variants(first: 10) {
      edges {
        node {
          id
          title
          availableForSale
          selectedOptions {
            name
            value
          }
          price { ...MoneyFragment }
          compareAtPrice { ...MoneyFragment }
        }
      }
    }
  }
`

export const PRODUCT_DETAIL_FRAGMENT = /* GraphQL */ `
  ${IMAGE_FRAGMENT}
  ${PRODUCT_VARIANT_FRAGMENT}
  fragment ProductDetailFragment on Product {
    id
    handle
    title
    description
    descriptionHtml
    vendor
    productType
    tags
    availableForSale
    options {
      id
      name
      values
    }
    priceRange {
      minVariantPrice { ...MoneyFragment }
      maxVariantPrice { ...MoneyFragment }
    }
    compareAtPriceRange {
      minVariantPrice { ...MoneyFragment }
      maxVariantPrice { ...MoneyFragment }
    }
    variants(first: 100) {
      edges {
        node { ...ProductVariantFragment }
      }
    }
    images(first: 20) {
      edges {
        node { ...ImageFragment }
      }
    }
    featuredImage { ...ImageFragment }
    seo {
      title
      description
    }
    updatedAt
    metafields(identifiers: [
      { namespace: "custom", key: "composition" }
      { namespace: "custom", key: "zlozenie" }
      { namespace: "custom", key: "usage" }
      { namespace: "custom", key: "davkovanie" }
      { namespace: "custom", key: "navod_pouzitia" }
      { namespace: "custom", key: "navod" }
    ]) {
      namespace
      key
      value
      type
    }
  }
`

// ─── Cart Fragment ────────────────────────────────────────────────────────────

export const CART_FRAGMENT = /* GraphQL */ `
  ${MONEY_FRAGMENT}
  ${IMAGE_FRAGMENT}
  fragment CartFragment on Cart {
    id
    checkoutUrl
    totalQuantity
    lines(first: 100) {
      edges {
        node {
          id
          quantity
          merchandise {
            ... on ProductVariant {
              id
              title
              selectedOptions {
                name
                value
              }
              product {
                id
                handle
                title
                featuredImage { ...ImageFragment }
              }
            }
          }
          cost {
            totalAmount { ...MoneyFragment }
            subtotalAmount { ...MoneyFragment }
          }
        }
      }
    }
    cost {
      subtotalAmount { ...MoneyFragment }
      totalAmount { ...MoneyFragment }
      totalTaxAmount { ...MoneyFragment }
    }
    discountCodes {
      code
      applicable
    }
  }
`

// ─── Product Queries ──────────────────────────────────────────────────────────

export const GET_PRODUCTS_QUERY = /* GraphQL */ `
  ${PRODUCT_LIST_ITEM_FRAGMENT}
  query GetProducts(
    $first: Int!
    $after: String
    $query: String
    $sortKey: ProductSortKeys
    $reverse: Boolean
  ) {
    products(
      first: $first
      after: $after
      query: $query
      sortKey: $sortKey
      reverse: $reverse
    ) {
      edges {
        node { ...ProductListItemFragment }
        cursor
      }
      pageInfo {
        hasNextPage
        hasPreviousPage
        startCursor
        endCursor
      }
    }
  }
`

export const GET_PRODUCT_BY_HANDLE_QUERY = /* GraphQL */ `
  ${PRODUCT_DETAIL_FRAGMENT}
  query GetProductByHandle($handle: String!) {
    product(handle: $handle) {
      ...ProductDetailFragment
    }
  }
`

export const GET_FEATURED_PRODUCTS_QUERY = /* GraphQL */ `
  ${PRODUCT_LIST_ITEM_FRAGMENT}
  query GetFeaturedProducts($first: Int!) {
    products(first: $first, sortKey: BEST_SELLING) {
      edges {
        node { ...ProductListItemFragment }
      }
    }
  }
`

// ─── Collection Queries ───────────────────────────────────────────────────────

export const GET_COLLECTION_BY_HANDLE_QUERY = /* GraphQL */ `
  ${IMAGE_FRAGMENT}
  ${PRODUCT_LIST_ITEM_FRAGMENT}
  query GetCollectionByHandle($handle: String!, $first: Int!, $after: String) {
    collection(handle: $handle) {
      id
      handle
      title
      description
      descriptionHtml
      image { ...ImageFragment }
      seo {
        title
        description
      }
      updatedAt
      products(first: $first, after: $after) {
        edges {
          node { ...ProductListItemFragment }
          cursor
        }
        pageInfo {
          hasNextPage
          hasPreviousPage
          startCursor
          endCursor
        }
      }
    }
  }
`

export const GET_COLLECTIONS_QUERY = /* GraphQL */ `
  ${IMAGE_FRAGMENT}
  query GetCollections($first: Int!) {
    collections(first: $first) {
      edges {
        node {
          id
          handle
          title
          description
          image { ...ImageFragment }
          updatedAt
        }
      }
    }
  }
`

export const GET_COLLECTIONS_PAGINATED_QUERY = /* GraphQL */ `
  ${IMAGE_FRAGMENT}
  query GetCollectionsPaginated($first: Int!, $after: String) {
    collections(first: $first, after: $after) {
      pageInfo {
        hasNextPage
        endCursor
      }
      edges {
        node {
          id
          handle
          title
          description
          image { ...ImageFragment }
          updatedAt
        }
      }
    }
  }
`

// ─── Search Query ─────────────────────────────────────────────────────────────

export const SEARCH_PRODUCTS_QUERY = /* GraphQL */ `
  ${PRODUCT_LIST_ITEM_FRAGMENT}
  query SearchProducts($query: String!, $first: Int!) {
    search(query: $query, first: $first, types: [PRODUCT]) {
      totalCount
      edges {
        node {
          ... on Product {
            ...ProductListItemFragment
          }
        }
      }
    }
  }
`

// ─── Cart Queries ─────────────────────────────────────────────────────────────

export const GET_CART_QUERY = /* GraphQL */ `
  ${CART_FRAGMENT}
  query GetCart($cartId: ID!) {
    cart(id: $cartId) {
      ...CartFragment
    }
  }
`

// ─── Sitemap Queries ──────────────────────────────────────────────────────────

export const GET_ALL_PRODUCTS_FOR_SITEMAP = /* GraphQL */ `
  query GetAllProductsForSitemap($first: Int!, $after: String) {
    products(first: $first, after: $after) {
      edges {
        node {
          handle
          updatedAt
        }
        cursor
      }
      pageInfo {
        hasNextPage
        endCursor
      }
    }
  }
`

export const GET_ALL_COLLECTIONS_FOR_SITEMAP = /* GraphQL */ `
  query GetAllCollectionsForSitemap($first: Int!) {
    collections(first: $first) {
      edges {
        node {
          handle
          updatedAt
        }
      }
    }
  }
`
