
import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';

const MAX_IMAGE_SIZE = 5 * 1024 * 1024;
const ALLOWED_IMAGE_TYPES = [
  'image/jpeg',
  'image/png',
  'image/webp',
];

function getStoragePath(imageUrl) {
  if (!imageUrl) return null;

  try {
    const url = new URL(imageUrl);
    const marker = '/storage/v1/object/public/product-images/';
    const index = url.pathname.indexOf(marker);

    if (index === -1) return null;

    return decodeURIComponent(
      url.pathname.slice(index + marker.length),
    );
  } catch {
    return null;
  }
}

export default function Admin() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loginError, setLoginError] = useState('');
  const [loginLoading, setLoginLoading] = useState(false);

  const [session, setSession] = useState(null);
  const [checkingSession, setCheckingSession] = useState(true);
  const [checkingAdmin, setCheckingAdmin] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [adminError, setAdminError] = useState('');

  const [products, setProducts] = useState([]);
  const [productsLoading, setProductsLoading] = useState(false);
  const [productsError, setProductsError] = useState('');

  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [newName, setNewName] = useState('');
  const [newCategory, setNewCategory] = useState('NEW ARRIVALS');
  const [newPrice, setNewPrice] = useState('');
  const [newDescription, setNewDescription] = useState('');
  const [newImage, setNewImage] = useState(null);
  const [imagePreview, setImagePreview] = useState('');
  const [imageInputKey, setImageInputKey] = useState(0);
  const [formError, setFormError] = useState('');
  const [savingProduct, setSavingProduct] = useState(false);
  const [deletingId, setDeletingId] = useState(null);

  // Create and clean up the local image preview.
  useEffect(() => {
    if (!newImage) {
      setImagePreview('');
      return;
    }

    const url = URL.createObjectURL(newImage);
    setImagePreview(url);

    return () => URL.revokeObjectURL(url);
  }, [newImage]);

  // Track the signed-in session.
  useEffect(() => {
    let mounted = true;

    async function checkSession() {
      const { data, error } = await supabase.auth.getSession();

      if (!mounted) return;

      if (error) {
        setLoginError(error.message);
      }

      setSession(data?.session ?? null);
      setCheckingSession(false);
    }

    checkSession();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, newSession) => {
      setSession(newSession);
      setCheckingSession(false);
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  // Verify the user's admin status before loading the dashboard.
  useEffect(() => {
    let active = true;

    async function verifyAdmin() {
      setIsAdmin(false);
      setAdminError('');
      setProducts([]);
      setProductsError('');

      if (!session?.user?.id) {
        setCheckingAdmin(false);
        return;
      }

      setCheckingAdmin(true);

      try {
        const { data: adminRecord, error } = await supabase
          .from('admins')
          .select('user_id')
          .eq('user_id', session.user.id)
          .maybeSingle();

        if (!active) return;

        if (error) {
          setAdminError(
            'Could not verify administrator access: ' + error.message,
          );
          return;
        }

        if (!adminRecord) {
          setIsAdmin(false);
          return;
        }

        setIsAdmin(true);
        setProductsLoading(true);

        const { data, error: fetchError } = await supabase
          .from('products')
          .select('*')
          .order('created_at', { ascending: true });

        if (!active) return;

        if (fetchError) {
          setProductsError(fetchError.message);
        } else {
          setProducts(data ?? []);
        }
      } catch (error) {
        if (active) {
          setAdminError(
            error.message || 'Could not verify administrator access.',
          );
        }
      } finally {
        if (active) {
          setCheckingAdmin(false);
          setProductsLoading(false);
        }
      }
    }

    verifyAdmin();

    return () => {
      active = false;
    };
  }, [session]);

  function resetForm() {
    setEditingId(null);
    setNewName('');
    setNewCategory('NEW ARRIVALS');
    setNewPrice('');
    setNewDescription('');
    setNewImage(null);
    setImageInputKey((key) => key + 1);
    setFormError('');
  }

  function startAddProduct() {
    resetForm();
    setShowForm(true);
  }

  function startEditProduct(product) {
    resetForm();
    setEditingId(product.id);
    setNewName(product.name ?? '');
    setNewCategory(product.category ?? 'NEW ARRIVALS');
    setNewPrice(String(product.price ?? ''));
    setNewDescription(product.description ?? '');
    setShowForm(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  function handleImageChange(event) {
    const file = event.target.files?.[0];

    setFormError('');

    if (!file) {
      setNewImage(null);
      return;
    }

    if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
      setNewImage(null);
      setFormError('Choose a JPG, PNG, or WebP image.');
      event.target.value = '';
      return;
    }

    if (file.size > MAX_IMAGE_SIZE) {
      setNewImage(null);
      setFormError('The image must be smaller than 5 MB.');
      event.target.value = '';
      return;
    }

    setNewImage(file);
  }

  async function refreshProducts() {
    const { data, error } = await supabase
      .from('products')
      .select('*')
      .order('created_at', { ascending: true });

    if (error) {
      setProductsError(error.message);
      return false;
    }

    setProducts(data ?? []);
    setProductsError('');
    return true;
  }

  async function handleSaveProduct(event) {
    event.preventDefault();
    setFormError('');

    if (!newName.trim()) {
      setFormError('Please enter a product name.');
      return;
    }

    if (
      newPrice.trim() === '' ||
      !Number.isFinite(Number(newPrice)) ||
      Number(newPrice) < 0
    ) {
      setFormError('Please enter a valid, non-negative price.');
      return;
    }

    setSavingProduct(true);

    let uploadedPath = null;
    let savedSuccessfully = false;

    const oldProduct = editingId
      ? products.find((product) => product.id === editingId)
      : null;

    try {
      let imageUrl = oldProduct?.image_url ?? '';

      // Upload a replacement image, if one was selected.
      if (newImage) {
        const safeName = newImage.name.replace(
          /[^a-zA-Z0-9._-]/g,
          '-',
        );

        uploadedPath = `${crypto.randomUUID()}-${safeName}`;

        const { error: uploadError } = await supabase.storage
          .from('product-images')
          .upload(uploadedPath, newImage, {
            contentType: newImage.type,
            upsert: false,
          });

        if (uploadError) throw uploadError;

        const { data } = supabase.storage
          .from('product-images')
          .getPublicUrl(uploadedPath);

        imageUrl = data.publicUrl;
      }

      const productData = {
        name: newName.trim(),
        category: newCategory.trim() || 'NEW ARRIVALS',
        price: Number(newPrice),
        description: newDescription.trim(),
        image_url: imageUrl,
      };

      let saveError;

      if (editingId) {
        const result = await supabase
          .from('products')
          .update(productData)
          .eq('id', editingId);

        saveError = result.error;
      } else {
        const result = await supabase
          .from('products')
          .insert(productData);

        saveError = result.error;
      }

      if (saveError) throw saveError;

      savedSuccessfully = true;

      // Only remove the previous image after the update succeeds.
      if (newImage && oldProduct?.image_url) {
        const oldPath = getStoragePath(oldProduct.image_url);

        if (oldPath && oldPath !== uploadedPath) {
          const { error: removeError } = await supabase.storage
            .from('product-images')
            .remove([oldPath]);

          if (removeError) {
            console.error('Could not remove old image:', removeError);
          }
        }
      }

      resetForm();
      setShowForm(false);
      await refreshProducts();
    } catch (error) {
      // Clean up a newly uploaded file if the database save failed.
      if (uploadedPath && !savedSuccessfully) {
        const { error: cleanupError } = await supabase.storage
          .from('product-images')
          .remove([uploadedPath]);

        if (cleanupError) {
          console.error('Image cleanup failed:', cleanupError);
        }
      }

      setFormError(error.message || 'Could not save this product.');
    } finally {
      setSavingProduct(false);
    }
  }

  async function handleDeleteProduct(product) {
    const confirmed = window.confirm(
      `Delete "${product.name}"? This action cannot be undone.`,
    );

    if (!confirmed) return;

    setDeletingId(product.id);
    setProductsError('');

    try {
      const { error } = await supabase
        .from('products')
        .delete()
        .eq('id', product.id);

      if (error) throw error;

      // Remove it from the UI immediately after database deletion.
      setProducts((current) =>
        current.filter((item) => item.id !== product.id),
      );

      // Clean up its stored image if it belongs to our bucket.
      const imagePath = getStoragePath(product.image_url);

      if (imagePath) {
        const { error: removeError } = await supabase.storage
          .from('product-images')
          .remove([imagePath]);

        if (removeError) {
          setProductsError(
            'Product deleted, but its old image could not be removed: ' +
              removeError.message,
          );
        }
      }
    } catch (error) {
      setProductsError(
        'Could not delete product: ' + (error.message || 'Unknown error'),
      );
    } finally {
      setDeletingId(null);
    }
  }

  async function handleLogin(event) {
    event.preventDefault();
    setLoginError('');
    setLoginLoading(true);

    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) setLoginError(error.message);
    } finally {
      setLoginLoading(false);
    }
  }

  async function handleSignOut() {
    const { error } = await supabase.auth.signOut();

    if (error) setLoginError(error.message);
  }

  // Initial loading screen.
  if (checkingSession || (session && checkingAdmin)) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#f8f5f0] text-[#34271f]">
        <p className="text-sm tracking-wide text-stone-500">
          Preparing your boutique...
        </p>
      </main>
    );
  }

  // Signed in, but not authorized as an administrator.
  if (session && !isAdmin) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#f8f5f0] px-5 text-[#34271f]">
        <div className="w-full max-w-md border border-[#e5ddd3] bg-white p-8 text-center">
          <p className="text-xs tracking-[0.3em] text-stone-500">
            MAISON ÉLISE
          </p>
          <h1 className="mt-5 font-serif text-3xl">
            Private access only
          </h1>
          <p className="mt-3 text-sm leading-6 text-stone-600">
            This account is not authorized to manage the boutique.
          </p>

          {adminError && (
            <p role="alert" className="mt-4 break-words text-sm text-red-700">
              {adminError}
            </p>
          )}

          <button
            onClick={handleSignOut}
            className="mt-6 bg-[#34271f] px-6 py-3 text-xs tracking-wide text-white"
          >
            SIGN OUT
          </button>
        </div>
      </main>
    );
  }

  // Admin dashboard.
  if (session && isAdmin) {
    return (
      <main className="min-h-screen bg-[#f8f5f0] px-5 py-8 text-[#34271f] sm:px-8 sm:py-12">
        <div className="mx-auto max-w-5xl">
          <header className="flex flex-col justify-between gap-6 border-b border-[#ded5c9] pb-8 sm:flex-row sm:items-end">
            <div>
              <p className="text-xs tracking-[0.3em] text-stone-500">
                MAISON ÉLISE
              </p>
              <h1 className="mt-4 font-serif text-4xl sm:text-5xl">
                Your Dashboard
              </h1>
              <p className="mt-3 text-sm text-stone-600">
                Welcome back. Manage your boutique here.
              </p>
            </div>

            <button
              onClick={handleSignOut}
              className="self-start border border-[#34271f] px-5 py-3 text-sm transition hover:bg-[#34271f] hover:text-white sm:self-auto"
            >
              Sign out
            </button>
          </header>

          <section className="mt-8">
            <div className="flex items-end justify-between gap-4">
              <div>
                <p className="text-xs tracking-[0.2em] text-stone-500">
                  YOUR INVENTORY
                </p>
                <h2 className="mt-2 font-serif text-3xl">Products</h2>
              </div>

              <p className="text-sm text-stone-500">
                {products.length}{' '}
                {products.length === 1 ? 'item' : 'items'}
              </p>
            </div>

            <div className="mt-6">
              <button
                type="button"
                onClick={() => {
                  if (showForm) {
                    resetForm();
                    setShowForm(false);
                  } else {
                    startAddProduct();
                  }
                }}
                className="bg-[#34271f] px-5 py-3 text-xs tracking-[0.15em] text-white transition hover:bg-[#49372b]"
              >
                {showForm ? 'CANCEL' : '+ ADD PRODUCT'}
              </button>

              {showForm && (
                <form
                  onSubmit={handleSaveProduct}
                  className="mt-5 space-y-5 border border-[#e5ddd3] bg-white p-5 sm:p-7"
                >
                  <h3 className="font-serif text-2xl">
                    {editingId ? 'Edit product' : 'Add a product'}
                  </h3>

                  <div>
                    <label
                      htmlFor="product-image"
                      className="mb-2 block text-xs tracking-wide text-stone-600"
                    >
                      {editingId ? 'Replace image (optional)' : 'Product image'}
                    </label>

                    <input
                      key={imageInputKey}
                      id="product-image"
                      type="file"
                      accept="image/jpeg,image/png,image/webp"
                      onChange={handleImageChange}
                      className="block w-full text-sm text-stone-600 file:mr-4 file:border-0 file:bg-[#34271f] file:px-4 file:py-3 file:text-xs file:tracking-wide file:text-white"
                    />

                    <p className="mt-2 text-xs text-stone-500">
                      JPG, PNG, or WebP · Maximum 5 MB
                    </p>

                    {imagePreview ? (
                      <div className="mt-4">
                        <p className="mb-2 text-xs text-stone-500">
                          New image preview
                        </p>
                        <img
                          src={imagePreview}
                          alt="Selected product"
                          className="h-40 w-32 bg-[#f3eee8] object-cover"
                        />
                      </div>
                    ) : editingId &&
                      products.find((item) => item.id === editingId)?.image_url ? (
                      <div className="mt-4">
                        <p className="mb-2 text-xs text-stone-500">
                          Current image
                        </p>
                        <img
                          src={
                            products.find((item) => item.id === editingId)
                              ?.image_url
                          }
                          alt="Current product"
                          className="h-40 w-32 bg-[#f3eee8] object-cover"
                        />
                      </div>
                    ) : null}
                  </div>

                  <div>
                    <label
                      htmlFor="product-name"
                      className="mb-2 block text-xs tracking-wide text-stone-600"
                    >
                      Product name
                    </label>
                    <input
                      id="product-name"
                      type="text"
                      value={newName}
                      onChange={(event) => setNewName(event.target.value)}
                      required
                      maxLength={150}
                      placeholder="e.g. The Sculpted Blazer"
                      className="w-full border border-[#ded5c9] bg-[#fdfcf9] px-4 py-3 text-sm outline-none focus:border-[#49372b]"
                    />
                  </div>

                  <div>
                    <label
                      htmlFor="product-category"
                      className="mb-2 block text-xs tracking-wide text-stone-600"
                    >
                      Category
                    </label>
                    <input
                      id="product-category"
                      type="text"
                      value={newCategory}
                      onChange={(event) => setNewCategory(event.target.value)}
                      maxLength={100}
                      className="w-full border border-[#ded5c9] bg-[#fdfcf9] px-4 py-3 text-sm outline-none focus:border-[#49372b]"
                    />
                  </div>

                  <div>
                    <label
                      htmlFor="product-price"
                      className="mb-2 block text-xs tracking-wide text-stone-600"
                    >
                      Price (DZD)
                    </label>
                    <input
                      id="product-price"
                      type="number"
                      min="0"
                      step="0.01"
                      value={newPrice}
                      onChange={(event) => setNewPrice(event.target.value)}
                      required
                      placeholder="12500"
                      className="w-full border border-[#ded5c9] bg-[#fdfcf9] px-4 py-3 text-sm outline-none focus:border-[#49372b]"
                    />
                  </div>

                  <div>
                    <label
                      htmlFor="product-description"
                      className="mb-2 block text-xs tracking-wide text-stone-600"
                    >
                      Description
                    </label>
                    <textarea
                      id="product-description"
                      value={newDescription}
                      onChange={(event) =>
                        setNewDescription(event.target.value)
                      }
                      rows={4}
                      maxLength={2000}
                      placeholder="Describe the product..."
                      className="w-full resize-y border border-[#ded5c9] bg-[#fdfcf9] px-4 py-3 text-sm outline-none focus:border-[#49372b]"
                    />
                  </div>

                  {formError && (
                    <p role="alert" className="break-words text-sm text-red-700">
                      {formError}
                    </p>
                  )}

                  <button
                    type="submit"
                    disabled={savingProduct}
                    className="bg-[#34271f] px-6 py-3 text-xs tracking-[0.15em] text-white transition hover:bg-[#49372b] disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {savingProduct
                      ? 'SAVING...'
                      : editingId
                        ? 'SAVE CHANGES'
                        : 'SAVE PRODUCT'}
                  </button>
                </form>
              )}
            </div>

            <div className="mt-6 border border-[#e5ddd3] bg-white">
              {productsLoading && (
                <p className="p-6 text-sm text-stone-500">
                  Loading your products...
                </p>
              )}

              {productsError && (
                <p role="alert" className="break-words p-6 text-sm text-red-700">
                  {productsError}
                </p>
              )}

              {!productsLoading &&
                !productsError &&
                products.length === 0 && (
                  <div className="px-6 py-12 text-center">
                    <h3 className="font-serif text-xl">
                      Your collection is waiting
                    </h3>
                    <p className="mt-2 text-sm text-stone-500">
                      No products found yet.
                    </p>
                  </div>
                )}

              {!productsLoading && products.length > 0 && (
                <div className="divide-y divide-[#eee8e0]">
                  {products.map((product) => (
                    <article
                      key={product.id}
                      className="flex min-w-0 items-center gap-4 p-4 sm:gap-6 sm:p-5"
                    >
                      {product.image_url ? (
                        <img
                          src={product.image_url}
                          alt={product.name}
                          loading="lazy"
                          className="h-24 w-20 shrink-0 bg-[#f3eee8] object-cover sm:h-28 sm:w-24"
                        />
                      ) : (
                        <div className="flex h-24 w-20 shrink-0 items-center justify-center bg-[#f3eee8] text-xs text-stone-400 sm:h-28 sm:w-24">
                          No image
                        </div>
                      )}

                      <div className="min-w-0 flex-1">
                        <p className="text-[10px] tracking-[0.18em] text-stone-500">
                          {product.category || 'COLLECTION'}
                        </p>
                        <h3 className="mt-2 break-words font-serif text-lg sm:text-xl">
                          {product.name}
                        </h3>
                        <p className="mt-2 text-sm font-medium">
                          {Number(product.price).toLocaleString('fr-DZ')} DZD
                        </p>

                        {product.description && (
                          <p className="mt-2 line-clamp-2 text-xs leading-5 text-stone-500">
                            {product.description}
                          </p>
                        )}

                        <div className="mt-4 flex flex-wrap gap-3">
                          <button
                            type="button"
                            onClick={() => startEditProduct(product)}
                            disabled={deletingId !== null || savingProduct}
                            className="border border-[#ded5c9] px-4 py-2 text-xs transition hover:bg-[#f8f5f0] disabled:opacity-50"
                          >
                            EDIT
                          </button>

                          <button
                            type="button"
                            onClick={() => handleDeleteProduct(product)}
                            disabled={deletingId !== null || savingProduct}
                            className="border border-red-200 px-4 py-2 text-xs text-red-700 transition hover:bg-red-50 disabled:opacity-50"
                          >
                            {deletingId === product.id
                              ? 'DELETING...'
                              : 'DELETE'}
                          </button>
                        </div>
                      </div>
                    </article>
                  ))}
                </div>
              )}
            </div>
          </section>

          <footer className="mt-12 border-t border-[#ded5c9] pt-5 text-xs tracking-wide text-stone-400">
            MAISON ÉLISE · ADMINISTRATION
          </footer>
        </div>
      </main>
    );
  }

  // Login page.
  return (
    <main className="flex min-h-screen items-center justify-center bg-[#f8f5f0] px-5 py-12 text-[#34271f]">
      <div className="w-full max-w-md">
        <div className="border border-[#e5ddd3] bg-white px-6 py-10 sm:px-10 sm:py-12">
          <p className="text-center text-xs tracking-[0.35em] text-stone-500">
            MAISON ÉLISE
          </p>

          <h1 className="mt-6 text-center font-serif text-4xl">
            Admin Login
          </h1>

          <p className="mt-3 text-center text-sm leading-6 text-stone-500">
            Sign in to manage your boutique.
          </p>

          <form onSubmit={handleLogin} className="mt-9 space-y-5">
            <div>
              <label
                htmlFor="admin-email"
                className="mb-2 block text-xs tracking-wide text-stone-600"
              >
                Email address
              </label>
              <input
                id="admin-email"
                type="email"
                autoComplete="username"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                required
                className="w-full border border-[#ded5c9] bg-[#fdfcf9] px-4 py-3 text-sm outline-none focus:border-[#49372b]"
                placeholder="Your admin email"
              />
            </div>

            <div>
              <label
                htmlFor="admin-password"
                className="mb-2 block text-xs tracking-wide text-stone-600"
              >
                Password
              </label>
              <input
                id="admin-password"
                type="password"
                autoComplete="current-password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                required
                className="w-full border border-[#ded5c9] bg-[#fdfcf9] px-4 py-3 text-sm outline-none focus:border-[#49372b]"
                placeholder="Your password"
              />
            </div>

            {loginError && (
              <p role="alert" className="break-words text-sm text-red-700">
                {loginError}
              </p>
            )}

            <button
              type="submit"
              disabled={loginLoading}
              className="w-full bg-[#34271f] px-4 py-3.5 text-xs tracking-[0.15em] text-white transition hover:bg-[#49372b] disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loginLoading ? 'SIGNING IN...' : 'SIGN IN'}
            </button>
          </form>
        </div>

        <p className="mt-5 text-center text-xs tracking-wide text-stone-400">
          MAISON ÉLISE · PRIVATE ACCESS
        </p>
      </div>
    </main>
  );
}


