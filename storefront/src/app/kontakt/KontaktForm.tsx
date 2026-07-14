'use client'

export function KontaktForm() {
  return (
    <div className="bg-white p-8 md:p-10 rounded-2xl shadow-(--shadow-card) border border-(--color-border)">
      <h2 className="text-2xl font-bold text-(--color-text) mb-8 font-montserrat">Napíšte nám</h2>

      <form
        className="space-y-6"
        onSubmit={(e) => {
          e.preventDefault()
          alert('Ďakujeme za vašu správu! (Toto je ukážka, e-mailový systém ešte nie je napojený)')
        }}
      >
        <div>
          <label className="block text-sm font-semibold text-(--color-text) mb-2">Vaše meno</label>
          <input
            type="text"
            required
            className="w-full px-4 py-3 rounded-lg border border-(--color-border) focus:border-(--color-accent-green) focus:ring-1 focus:ring-(--color-accent-green) outline-none transition-shadow"
            placeholder="Jozef Novák"
          />
        </div>
        <div>
          <label className="block text-sm font-semibold text-(--color-text) mb-2">E-mailová adresa</label>
          <input
            type="email"
            required
            className="w-full px-4 py-3 rounded-lg border border-(--color-border) focus:border-(--color-accent-green) focus:ring-1 focus:ring-(--color-accent-green) outline-none transition-shadow"
            placeholder="jozef@email.sk"
          />
        </div>
        <div>
          <label className="block text-sm font-semibold text-(--color-text) mb-2">Správa</label>
          <textarea
            rows={4}
            required
            className="w-full px-4 py-3 rounded-lg border border-(--color-border) focus:border-(--color-accent-green) focus:ring-1 focus:ring-(--color-accent-green) outline-none transition-shadow"
            placeholder="Dobrý deň, chcel by som sa opýtať..."
          />
        </div>
        <button type="submit" className="btn btn-primary w-full py-4 text-lg">
          Odoslať správu
        </button>
      </form>
    </div>
  )
}
