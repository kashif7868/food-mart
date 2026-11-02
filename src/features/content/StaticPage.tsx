import Link from "next/link";

/* Simple content pages linked from the footer */
export const PAGES: Record<string, { title: string; intro: string; sections: [string, string][] }> = {
  help: {
    title: "Help Center",
    intro: "Answers to the most common questions about ordering, reviews and your account.",
    sections: [
      ["How do I place an order?", "Open a dish, tap Add to cart, then Checkout. Choose delivery or pickup and pay cash on delivery or at pickup. You can track the order live from My orders."],
      ["Can I cancel an order?", "Yes - before the restaurant accepts it, or within a few minutes after acceptance (the exact window is set by FoodMart). After that, please contact the restaurant."],
      ["Why can I only order from one restaurant at a time?", "Each order is prepared and delivered by one seller, so a cart holds items from one restaurant, chef or food point."],
      ["How do reviews work?", "Only customers with a completed order can review that order. This keeps ratings honest."],
      ["How do I become a partner?", "Use Partner With Us to create a restaurant, home chef, food point or blogger profile, then manage it from the FoodMart dashboard."],
    ],
  },
  safety: {
    title: "Safety",
    intro: "Your safety and trust come first on FoodMart.",
    sections: [
      ["Verified sellers", "Sellers can submit business and food-safety documents. Verified profiles show a purple badge."],
      ["Honest content", "Sponsored posts are always labelled and never change rankings, recommendations or awards."],
      ["Report a problem", "Use the report option on posts, reviews and profiles, or contact our support team."],
    ],
  },
  contact: {
    title: "Contact Us",
    intro: "We're here to help.",
    sections: [
      ["Customer support", "Email support@foodmart.pk - we reply within one working day."],
      ["Partners", "Restaurants, chefs, food points and bloggers can reach the partner team at partners@foodmart.pk."],
      ["Office", "FoodMart, Karachi, Pakistan."],
    ],
  },
  privacy: {
    title: "Privacy Policy",
    intro: "How FoodMart collects, uses and protects your information.",
    sections: [
      ["What we collect", "Account details (name, email, phone), delivery addresses, orders, reviews and in-app activity such as views and favourites."],
      ["How we use it", "To process orders, show relevant recommendations, prevent fraud and improve FoodMart. We never sell personal data."],
      ["Location", "We use your selected city, or your device location only when you allow it, to show nearby food."],
      ["Your choices", "You can edit your profile, preferences and addresses, or deactivate your account at any time."],
    ],
  },
  terms: {
    title: "Terms of Service",
    intro: "The rules for using FoodMart.",
    sections: [
      ["Orders", "Prices and totals are calculated by FoodMart from the seller's live menu. Sellers are responsible for food quality and preparation."],
      ["Content", "Posts, reels and reviews must be honest and follow our community guidelines. Sponsored content must be disclosed."],
      ["Accounts", "Keep your password safe. FoodMart may suspend accounts that break these terms."],
    ],
  },
  cookies: {
    title: "Cookie Policy",
    intro: "FoodMart uses only the storage needed to run the app.",
    sections: [
      ["Essential storage", "Your sign-in session and selected city are stored in your browser so you stay signed in."],
      ["Analytics", "We count reel views and food views anonymously per session to show trending content and improve recommendations."],
    ],
  },
};

export default function StaticPage({ slug }: { slug: keyof typeof PAGES }) {
  const page = PAGES[slug];
  return (
    <div className="container-fm max-w-3xl py-8 sm:py-12">
      <h1 className="text-3xl font-extrabold text-navy-900 sm:text-4xl">{page.title}</h1>
      <p className="mt-2 text-ink-500">{page.intro}</p>
      <div className="mt-8 space-y-4">
        {page.sections.map(([h, text]) => (
          <section key={h} className="card p-5">
            <h2 className="font-bold text-navy-900">{h}</h2>
            <p className="mt-1.5 text-sm leading-relaxed text-ink-600">{text}</p>
          </section>
        ))}
      </div>
      <p className="mt-8 text-sm text-ink-500">
        Still need help?{" "}
        <Link href="/contact" className="font-semibold text-brand-500">
          Contact us
        </Link>
      </p>
    </div>
  );
}
