"use client";

import Link from "next/link";
import { Clock, MapPin, MessageCircle, Phone, ShoppingBag, Sparkles, Wrench } from "lucide-react";
import { Button } from "@/components/ui/button";
import { openChat } from "@/components/chatbot/ChatWidget";
import { ProductCard, SharedViewCanvas } from "@/components/ecommerce/ProductCard";
import { HomeHero } from "@/components/layout/HomeHero";
import { ServiceCard } from "@/components/services/ServiceCard";
import { LoadingState } from "@/components/shared/States";
import { repos } from "@/lib/data";
import { useQuery, useSettings } from "@/lib/data/hooks";

const steps = [
  ["Design", "Choose the piece, metal, stone, and size in 3D and see an estimate right away."],
  ["Owner reviews and confirms the price", "The owner checks your design and sends a quotation with the final price and date."],
  ["Pay the down payment", "Pay by GCash or bank transfer and upload your receipt."],
  ["Claim in store", "We tell you when it's ready. Pick it up and settle the balance in Montalban."],
];

export default function HomePage() {
  const settings = useSettings();
  const products = useQuery("home:products", () => repos.catalog.listProducts({ availability: "available" }));
  const optionsQ = useQuery("options:active", () => repos.customization.getOptions());
  const services = useQuery("services:visible", () => repos.catalog.listServices());

  return (
    <>
      <SharedViewCanvas />
      <section className="mx-auto grid max-w-7xl items-center gap-10 px-4 py-12 lg:grid-cols-2 lg:py-20">
        <div>
          <p className="text-sm font-medium tracking-[0.2em] text-gold-dark uppercase">Afable&apos;s Jewelry Store · Montalban</p>
          <h1 className="mt-3 text-5xl leading-[1.05] sm:text-6xl">Jewelry made the way you imagine it.</h1>
          <p className="mt-5 max-w-xl text-lg text-muted-foreground">
            Design your piece in 3D, order from our collection, or book a repair — all from Afable&apos;s Jewelry Store in Montalban.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Button asChild size="lg">
              <Link href="/customize">
                <Sparkles className="size-4" /> Design your piece
              </Link>
            </Button>
            <Button asChild size="lg" variant="outline">
              <Link href="/shop">Shop the collection</Link>
            </Button>
            <Button asChild size="lg" variant="ghost">
              <Link href="/services">Book a service</Link>
            </Button>
          </div>
        </div>
        <HomeHero />
      </section>

      <section className="mx-auto max-w-7xl px-4" aria-label="What you can do">
        <div className="grid gap-4 md:grid-cols-3">
          {[
            {
              icon: Sparkles,
              title: "Design in 3D",
              text: "Pick the metal, color, stone, and size. Watch your piece change as you go.",
              href: "/customize",
              cta: "Start designing",
            },
            {
              icon: ShoppingBag,
              title: "Shop ready-made",
              text: "Rings, pendants, necklaces, bracelets, and earrings — ready to order or made to order.",
              href: "/shop",
              cta: "Browse the shop",
            },
            {
              icon: Wrench,
              title: "Repairs and services",
              text: "Cleaning, resizing, stone setting, watch batteries, and more.",
              href: "/services",
              cta: "See services",
            },
          ].map(({ icon: Icon, title, text, href, cta }) => (
            <Link key={title} href={href} className="group rounded-2xl border border-line bg-paper p-6 transition-shadow hover:shadow-md">
              <Icon className="size-7 text-gold" aria-hidden />
              <h2 className="mt-3 text-2xl">{title}</h2>
              <p className="mt-1 text-muted-foreground">{text}</p>
              <span className="mt-4 inline-block font-medium text-gold-dark group-hover:underline">{cta} →</span>
            </Link>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-16" aria-labelledby="how-title">
        <h2 id="how-title" className="text-4xl">
          How custom orders work
        </h2>
        <ol className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {steps.map(([t, d], i) => (
            <li key={t} className="rounded-2xl border border-line bg-paper p-5">
              <span className="flex size-9 items-center justify-center rounded-full bg-emerald font-semibold text-ivory">{i + 1}</span>
              <p className="mt-3 font-semibold">{t}</p>
              <p className="mt-1 text-sm text-muted-foreground">{d}</p>
            </li>
          ))}
        </ol>
      </section>

      <section className="mx-auto max-w-7xl px-4" aria-labelledby="featured-title">
        <div className="flex items-end justify-between gap-3">
          <h2 id="featured-title" className="text-4xl">
            Featured pieces
          </h2>
          <Link href="/shop" className="text-gold-dark hover:underline">
            View all
          </Link>
        </div>
        <div className="mt-6">
          {products.data ? (
            <ul className="grid grid-cols-1 gap-5 min-[420px]:grid-cols-2 lg:grid-cols-4">
              {products.data.slice(0, 4).map((p) => (
                <li key={p.id}>
                  <ProductCard product={p} options={optionsQ.data} />
                </li>
              ))}
            </ul>
          ) : (
            <LoadingState rows={1} />
          )}
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-16" aria-labelledby="services-title">
        <div className="flex items-end justify-between gap-3">
          <h2 id="services-title" className="text-4xl">
            Popular services
          </h2>
          <Link href="/services" className="text-gold-dark hover:underline">
            All services
          </Link>
        </div>
        <div className="mt-6">
          {services.data ? (
            <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {services.data.slice(0, 4).map((s) => (
                <li key={s.id}>
                  <ServiceCard service={s} />
                </li>
              ))}
            </ul>
          ) : (
            <LoadingState rows={1} />
          )}
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4" aria-labelledby="visit-title">
        <div className="grid gap-6 rounded-3xl bg-emerald p-8 text-ivory md:grid-cols-[1.4fr_1fr] md:p-12">
          <div>
            <h2 id="visit-title" className="text-4xl">
              Visit the store
            </h2>
            <ul className="mt-4 space-y-2 text-ivory/90">
              <li className="flex gap-2">
                <MapPin className="mt-1 size-4 shrink-0 text-gold" aria-hidden /> {settings.address}
              </li>
              <li className="flex gap-2">
                <Clock className="mt-1 size-4 shrink-0 text-gold" aria-hidden /> {settings.openingHours}
              </li>
              <li className="flex gap-2">
                <Phone className="mt-1 size-4 shrink-0 text-gold" aria-hidden /> {settings.contactNumber}
              </li>
            </ul>
          </div>
          <div className="flex flex-col justify-center gap-3 rounded-2xl bg-white/5 p-6">
            <p className="font-heading text-2xl">Have a question?</p>
            <p className="text-ivory/80">Our assistant can answer questions and help you prepare a custom order or service request.</p>
            <Button onClick={openChat} className="bg-gold text-ink hover:bg-gold/90">
              <MessageCircle className="size-4" /> Ask our assistant
            </Button>
          </div>
        </div>
      </section>
    </>
  );
}
