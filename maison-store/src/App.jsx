import { useEffect, useState } from 'react';
import { supabase } from './lib/supabase';

/* Fonts + small global touches (design only) */
function DesignStyles() {
  return (
    <style>{`
      @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;0,500;1,300;1,400&family=Jost:wght@300;400;500&display=swap');

      html { scroll-behavior: smooth; }

      .maison {
        font-family: 'Jost', system-ui, sans-serif;
        font-weight: 300;
        -webkit-font-smoothing: antialiased;
        -moz-osx-font-smoothing: grayscale;
      }
      .maison .font-serif {
        font-family: 'Cormorant Garamond', Georgia, 'Times New Roman', serif;
        font-weight: 300;
      }
      .maison ::selection { background: #d9c8b4; color: #2a201a; }

      .maison a:focus-visible,
      .maison button:focus-visible {
        outline: 1px solid #2a201a;
        outline-offset: 4px;
      }

      @keyframes maison-reveal {
        from { transform: scale(1.06); opacity: 0.6; }
        to   { transform: scale(1);    opacity: 1; }
      }
      .maison .hero-img { animation: maison-reveal 1.6s cubic-bezier(.2,.7,.2,1) both; }

      @media (prefers-reduced-motion: reduce) {
        html { scroll-behavior: auto; }
        .maison .hero-img { animation: none; }
        .maison * { transition-duration: 0.01ms !important; }
      }
    `}</style>
  );
}

function Navbar() {
  return (
    <header className="sticky top-0 z-50 flex items-center justify-between border-b border-[#2a201a]/10 bg-[#f6f1ea]/85 px-5 py-4 backdrop-blur-md md:px-12 md:py-5">
      <a
        href="#home"
        className="font-serif text-xl font-normal tracking-[0.3em] md:text-2xl"
      >
        MAISON ÉLISE
      </a>

      <nav className="hidden items-center gap-10 text-[11px] uppercase tracking-[0.2em] text-[#4a372b] md:flex">
        <a
          className="relative pb-1 transition-opacity after:absolute after:bottom-0 after:left-0 after:h-px after:w-0 after:bg-[#2a201a] after:transition-all after:duration-500 hover:after:w-full"
          href="#collection"
        >
          Collection
        </a>
        <a
          className="relative pb-1 transition-opacity after:absolute after:bottom-0 after:left-0 after:h-px after:w-0 after:bg-[#2a201a] after:transition-all after:duration-500 hover:after:w-full"
          href="#story"
        >
          Our philosophy
        </a>
      </nav>

      <a
        href="#collection"
        className="group border border-[#2a201a]/70 px-4 py-3 text-[10px] uppercase tracking-[0.2em] transition-colors duration-500 hover:bg-[#2a201a] hover:text-[#f6f1ea] md:px-6"
      >
        Discover{' '}
        <span className="ml-2 inline-block transition-transform duration-500 group-hover:-translate-y-0.5 group-hover:translate-x-0.5">
          ↗
        </span>
      </a>
    </header>
  );
}

function Hero() {
  return (
    <section
      id="home"
      className="grid min-h-[650px] grid-cols-1 md:min-h-[720px] md:grid-cols-[0.9fr_1.1fr]"
    >
      <div className="flex flex-col justify-center px-6 py-16 md:px-14 md:py-20 lg:px-24">
        <p className="mb-9 text-[11px] uppercase tracking-[0.3em] text-[#7a6a5b]">
          An exercise in effortless style
        </p>

        <h1 className="font-serif text-[64px] font-light leading-[0.95] tracking-[-0.025em] sm:text-[80px] lg:text-[104px]">
          Less,
          <br />
          but <em className="font-light italic">lovelier.</em>
        </h1>

        <p className="mt-9 max-w-[22rem] text-[15px] font-light leading-[1.85] text-[#6b5c4f]">
          Thoughtfully chosen pieces for the woman who finds beauty in
          simplicity. A little less noise, a little more you.
        </p>

        <div className="mt-11">
          <a
            href="#collection"
            className="group inline-flex items-center gap-10 bg-[#3a2a20] px-7 py-[18px] text-[11px] uppercase tracking-[0.2em] text-[#f6f1ea] transition-colors duration-500 hover:bg-[#6b5242]"
          >
            Explore the collection
            <span className="transition-transform duration-500 group-hover:-translate-y-0.5 group-hover:translate-x-0.5">
              ↗
            </span>
          </a>
        </div>

        <div className="mt-20 flex items-center gap-4 text-[10px] uppercase tracking-[0.25em] text-[#7a6a5b]">
          <span className="h-px w-12 bg-[#a98c6b]" />
          Considered style. Every day.
        </div>
      </div>

      <div className="relative min-h-[460px] overflow-hidden bg-[#e8dfd4] md:min-h-0">
        <img
          src="https://images.unsplash.com/photo-1539109136881-3be0616acf4b?auto=format&fit=crop&w=1400&q=90"
          alt="Editorial fashion portrait"
          className="hero-img absolute inset-0 h-full w-full object-cover object-center"
        />

        <div className="absolute inset-0 bg-gradient-to-t from-[#1c140f]/45 via-transparent to-transparent" />

        {/* thin inset frame */}
        <div className="pointer-events-none absolute inset-4 border border-white/35 md:inset-6" />

        <div className="absolute bottom-10 left-9 right-9 flex items-end justify-between text-white md:bottom-14 md:left-14 md:right-14">
          <div>
            <p className="mb-3 text-[10px] uppercase tracking-[0.28em] text-white/85">
              The Autumn Edition
            </p>
            <p className="font-serif text-4xl font-light italic md:text-5xl">
              A softer statement.
            </p>
          </div>
          <span className="text-[11px] tracking-[0.2em] text-white/85">
            01 / 03
          </span>
        </div>
      </div>
    </section>
  );
}

function ProductCard({ product, index }) {
  return (
    <article className="group">
      <div className="relative overflow-hidden bg-[#ece3d7]">
        <div className="aspect-[3/4] overflow-hidden">
          <img
            src={product.image_url || ''}
            alt={product.name}
            loading="lazy"
            className="h-full w-full object-cover transition-transform duration-[1200ms] ease-out group-hover:scale-[1.035]"
          />
        </div>

        <span className="absolute left-3 top-3 bg-[#f6f1ea]/90 px-3 py-[7px] text-[10px] uppercase tracking-[0.18em] text-[#4a372b] backdrop-blur-sm md:left-4 md:top-4">
          {product.category}
        </span>

        <span className="absolute bottom-3 right-3 flex h-11 w-11 items-center justify-center rounded-full bg-[#f6f1ea] text-base transition-all duration-500 group-hover:bg-[#3a2a20] group-hover:text-white md:bottom-4 md:right-4 md:translate-y-2 md:opacity-0 md:group-hover:translate-y-0 md:group-hover:opacity-100">
          ↗
        </span>
      </div>

      <div className="flex items-end justify-between gap-4 pb-2 pt-5">
        <div>
          <p className="mb-2 text-[10px] uppercase tracking-[0.2em] text-[#7a6a5b]">
            No. {String(index + 1).padStart(2, '0')}
          </p>
          <h3 className="font-serif text-2xl font-normal leading-tight md:text-[26px]">
            {product.name}
          </h3>
        </div>

        <p className="whitespace-nowrap pb-1 text-[13px] font-normal tracking-[0.06em] text-[#4a372b]">
          {Number(product.price).toLocaleString('fr-DZ')} DA
        </p>
      </div>

      <span className="block h-px w-full origin-left scale-x-0 bg-[#a98c6b] transition-transform duration-700 group-hover:scale-x-100" />
    </article>
  );
}

function Collection({ products }) {
  return (
    <section id="collection" className="px-5 py-24 md:px-12 md:py-32">
      <div className="mb-14 flex flex-col justify-between gap-6 md:mb-20 md:flex-row md:items-end">
        <div>
          <p className="mb-5 text-[11px] uppercase tracking-[0.28em] text-[#7a6a5b]">
            Fewer things, better chosen
          </p>
          <h2 className="font-serif text-5xl font-light leading-[1] tracking-[-0.025em] md:text-7xl">
            The considered <em className="font-light italic">wardrobe.</em>
          </h2>
        </div>

        <p className="max-w-[18rem] text-[13px] font-light leading-[1.9] text-[#6b5c4f]">
          Pieces to wear on repeat. Designed to feel right today and
          season after season.
        </p>
      </div>

      {products.length === 0 ? (
        <p className="py-20 text-center font-serif text-2xl italic text-[#7a6a5b]">
          Our collection is being prepared. Please check back soon.
        </p>
      ) : (
        <div className="grid grid-cols-1 gap-x-6 gap-y-14 sm:grid-cols-2 lg:grid-cols-3 lg:gap-x-8 lg:gap-y-16">
          {products.map((product, index) => (
            <ProductCard
              key={product.id}
              product={product}
              index={index}
            />
          ))}
        </div>
      )}

      <div className="mt-20 flex justify-center">
        <a
          href="#story"
          className="border-b border-[#3a2a20] pb-2 text-[11px] uppercase tracking-[0.22em] transition-opacity duration-500 hover:opacity-50"
        >
          More about our philosophy ↗
        </a>
      </div>
    </section>
  );
}

function Story() {
  return (
    <section
      id="story"
      className="grid grid-cols-1 bg-[#ebe2d6] md:grid-cols-2"
    >
      <div className="flex min-h-[380px] flex-col justify-center px-7 py-20 md:px-14 lg:px-24">
        <p className="mb-8 text-[11px] uppercase tracking-[0.28em] text-[#7a6a5b]">
          A note on style
        </p>

        <h2 className="font-serif text-5xl font-light leading-[1.02] tracking-[-0.025em] md:text-7xl">
          Beauty in
          <br />
          <em className="font-light italic">the in-between.</em>
        </h2>

        <p className="mt-9 max-w-md font-serif text-xl font-normal leading-[1.7] text-[#5a4a3d]">
          We believe getting dressed should feel less like a decision
          and more like coming home to yourself. Honest textures,
          considered details, and pieces that leave room for your own
          story.
        </p>
      </div>

      <div className="relative min-h-[420px] overflow-hidden md:min-h-[560px]">
        <img
          src="https://images.unsplash.com/photo-1490481651871-ab68de25d43d?auto=format&fit=crop&w=1200&q=85"
          alt="Carefully curated wardrobe in neutral tones"
          loading="lazy"
          className="absolute inset-0 h-full w-full object-cover"
        />
        <div className="pointer-events-none absolute inset-4 border border-white/35 md:inset-6" />
      </div>
    </section>
  );
}

function Footer() {
  return (
    <footer className="px-5 pb-8 pt-16 md:px-12 md:pt-24">
      <div className="flex flex-col items-start justify-between gap-10 border-b border-[#2a201a]/10 pb-12 md:flex-row md:items-end">
        <div>
          <a
            href="#home"
            className="font-serif text-2xl font-normal tracking-[0.3em]"
          >
            MAISON ÉLISE
          </a>
          <p className="mt-5 font-serif text-3xl font-light italic text-[#7a6a5b]">
            Less, but better. Always.
          </p>
        </div>

        <a
          href="#home"
          className="text-[11px] uppercase tracking-[0.22em] transition-opacity duration-500 hover:opacity-50"
        >
          Back to top ↑
        </a>
      </div>

      <div className="flex flex-col gap-3 pt-7 text-[10px] uppercase tracking-[0.2em] text-[#7a6a5b] sm:flex-row sm:items-center sm:justify-between">
        <span>© 2026 Maison Élise</span>
        <span>Made with an eye for the details.</span>
      </div>
    </footer>
  );
}

function App() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    async function fetchProducts() {
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .order('created_at', { ascending: true });

      if (error) {
        setError(error.message);
      } else {
        setProducts(data ?? []);
      }

      setLoading(false);
    }

    fetchProducts();
  }, []);

  return (
    <div className="maison min-h-screen bg-[#f6f1ea] text-[#2a201a]">
      <DesignStyles />
      <Navbar />

      {loading ? (
        <main className="flex min-h-[60vh] items-center justify-center">
          <p className="font-serif text-3xl italic text-[#7a6a5b]">
            Preparing the collection...
          </p>
        </main>
      ) : error ? (
        <main className="flex min-h-[60vh] flex-col items-center justify-center gap-4 px-6 text-center">
          <h1 className="font-serif text-4xl font-normal">
            We couldn't load the collection.
          </h1>
          <p className="max-w-lg text-sm leading-7 text-[#6b5c4f]">
            {error}
          </p>
          <button
            onClick={() => window.location.reload()}
            className="mt-3 bg-[#3a2a20] px-7 py-3.5 text-[11px] uppercase tracking-[0.22em] text-white transition-colors duration-500 hover:bg-[#6b5242]"
          >
            Try again
          </button>
        </main>
      ) : (
        <main>
          <Hero />
          <Collection products={products} />
          <Story />
        </main>
      )}

      <Footer />
    </div>
  );
}

export default App;



