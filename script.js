const products = window.ELEINS_DATA?.products || [];
const galleryItems = window.ELEINS_DATA?.gallery || [];

const productGrid = document.getElementById('productGrid');
const productSelect = document.getElementById('product');
const modal = document.getElementById('productModal');

function getProductImages(product) {
  if (Array.isArray(product.images) && product.images.length) return product.images;
  if (product.image) return [product.image];
  return [];
}

function createSliderMarkup(images, title, extraClass = '') {
  const safeImages = images.length ? images : [''];
  const slides = safeImages.map((image, index) => `
    <img
      class="slide-image${index === 0 ? ' active' : ''}"
      src="${image}"
      alt="${title} - photo ${index + 1}"
      loading="lazy"
      onerror="handleSlideError(this)"
    >
  `).join('');

  const dots = safeImages.length > 1
    ? `<div class="slider-dots" aria-hidden="true">${safeImages.map((_, index) => `<span class="slider-dot${index === 0 ? ' active' : ''}"></span>`).join('')}</div>`
    : '';

  return `
    <div class="auto-slider ${extraClass}" data-slide-interval="2800">
      ${slides}
      <span class="image-fallback" hidden>${title.toUpperCase()}</span>
      ${dots}
    </div>
  `;
}

window.handleSlideError = function handleSlideError(image) {
  image.hidden = true;
  const slider = image.closest('.auto-slider');
  if (!slider) return;
  const usableSlides = [...slider.querySelectorAll('.slide-image')].filter(slide => !slide.hidden);
  if (!usableSlides.length) {
    const fallback = slider.querySelector('.image-fallback');
    if (fallback) fallback.hidden = false;
    return;
  }
  if (image.classList.contains('active')) {
    image.classList.remove('active');
    usableSlides[0].classList.add('active');
  }
};

function initializeAutoSliders(root = document) {
  root.querySelectorAll('.auto-slider:not([data-slider-ready])').forEach(slider => {
    slider.dataset.sliderReady = 'true';
    const slides = [...slider.querySelectorAll('.slide-image')];
    const dots = [...slider.querySelectorAll('.slider-dot')];
    if (slides.length <= 1) return;

    let current = 0;
    let timer;
    const interval = Number(slider.dataset.slideInterval) || 2800;

    const showSlide = index => {
      const usable = slides.map((slide, i) => ({ slide, i })).filter(item => !item.slide.hidden);
      if (!usable.length) return;
      const target = usable.find(item => item.i === index) || usable[0];
      current = target.i;
      slides.forEach((slide, i) => slide.classList.toggle('active', i === current));
      dots.forEach((dot, i) => dot.classList.toggle('active', i === current));
    };

    const nextSlide = () => {
      let next = current;
      for (let attempt = 0; attempt < slides.length; attempt += 1) {
        next = (next + 1) % slides.length;
        if (!slides[next].hidden) break;
      }
      showSlide(next);
    };

    const start = () => {
      clearInterval(timer);
      timer = setInterval(nextSlide, interval);
    };
    const stop = () => clearInterval(timer);

    slider.addEventListener('mouseenter', stop);
    slider.addEventListener('mouseleave', start);
    slider.addEventListener('focusin', stop);
    slider.addEventListener('focusout', start);
    start();
  });
}

function renderProducts(filter = 'all') {
  const filtered = filter === 'all' ? products : products.filter(product => product.category === filter);
  productGrid.innerHTML = filtered.map(product => `
    <article class="product-card reveal visible">
      <div class="product-thumb">
        ${createSliderMarkup(getProductImages(product), product.title)}
      </div>
      <div class="product-body">
        <span class="product-category">${product.categoryLabel}</span>
        <h3 class="product-title">${product.title}</h3>
        <p class="product-description">${product.description}</p>
        <div class="product-footer">
          <strong class="product-price">${product.price}</strong>
          <button class="inquire-btn" data-product-id="${product.id}">Inquire</button>
        </div>
      </div>
    </article>
  `).join('');
  initializeAutoSliders(productGrid);
}

function renderGallery() {
  const galleryGrid = document.getElementById('galleryGrid');
  if (!galleryGrid) return;
  galleryGrid.innerHTML = galleryItems.map(item => `
    <div class="gallery-item ${item.className || ''} reveal visible">
      <img src="${item.image}" alt="${item.title}" onerror="this.hidden=true; this.nextElementSibling.hidden=false;">
      <span class="image-fallback" hidden>${item.title}</span>
    </div>
  `).join('');
}

function populateProductSelect() {
  productSelect.innerHTML += products.map(product => `<option value="${product.title}">${product.title} — ${product.price}</option>`).join('');
}

renderProducts();
renderGallery();
populateProductSelect();

// Filters
document.getElementById('productFilters').addEventListener('click', event => {
  const button = event.target.closest('.filter-btn');
  if (!button) return;
  document.querySelectorAll('.filter-btn').forEach(btn => btn.classList.remove('active'));
  button.classList.add('active');
  renderProducts(button.dataset.filter);
});

// Product modal
productGrid.addEventListener('click', event => {
  const button = event.target.closest('[data-product-id]');
  if (!button) return;
  const product = products.find(item => item.id === Number(button.dataset.productId));
  if (!product) return;

  document.getElementById('modalCategory').textContent = product.categoryLabel;
  document.getElementById('modalTitle').textContent = product.title;
  document.getElementById('modalDescription').textContent = product.description;
  document.getElementById('modalPrice').textContent = product.price;
  document.getElementById('modalImage').innerHTML = createSliderMarkup(getProductImages(product), product.title, 'modal-auto-slider');
  initializeAutoSliders(document.getElementById('modalImage'));
  document.getElementById('modalOrderBtn').onclick = () => { productSelect.value = product.title; closeModal(); };
  openModal();
});

function openModal() {
  modal.classList.add('open');
  modal.setAttribute('aria-hidden', 'false');
  document.body.classList.add('modal-open');
}
function closeModal() {
  modal.classList.remove('open');
  modal.setAttribute('aria-hidden', 'true');
  document.body.classList.remove('modal-open');
}
modal.addEventListener('click', event => {
  if (event.target.matches('[data-close-modal]')) closeModal();
});
document.addEventListener('keydown', event => {
  if (event.key === 'Escape') closeModal();
});

// Mobile menu
const menuToggle = document.getElementById('menuToggle');
const mainNav = document.getElementById('mainNav');
menuToggle.addEventListener('click', () => {
  const isOpen = mainNav.classList.toggle('open');
  menuToggle.setAttribute('aria-expanded', String(isOpen));
});
mainNav.addEventListener('click', event => {
  if (event.target.tagName === 'A') {
    mainNav.classList.remove('open');
    menuToggle.setAttribute('aria-expanded', 'false');
  }
});

// Scroll effects
const backToTop = document.getElementById('backToTop');
window.addEventListener('scroll', () => {
  document.querySelector('.site-header').classList.toggle('scrolled', window.scrollY > 20);
  backToTop.classList.toggle('show', window.scrollY > 700);
});
backToTop.addEventListener('click', () => window.scrollTo({ top: 0, behavior: 'smooth' }));

const observer = new IntersectionObserver(entries => {
  entries.forEach(entry => {
    if (entry.isIntersecting) entry.target.classList.add('visible');
  });
}, { threshold: 0.12 });
document.querySelectorAll('.reveal').forEach(element => observer.observe(element));

// DTI permit
const viewPermitButton = document.getElementById('viewPermit');

if (viewPermitButton) {
  viewPermitButton.addEventListener('click', () => {
    window.open('images/dti-permit.pdf', '_blank', 'noopener');
  });
}


document.getElementById('year').textContent = new Date().getFullYear();

// Gallery image lightbox
const galleryLightbox = document.getElementById('galleryLightbox');
const galleryLightboxImage = document.getElementById('galleryLightboxImage');
const galleryLightboxClose = document.getElementById('galleryLightboxClose');

document.addEventListener('click', event => {
  const galleryImage = event.target.closest('.gallery-item img');

  if (!galleryImage) return;

  galleryLightboxImage.src = galleryImage.src;
  galleryLightboxImage.alt = galleryImage.alt;
  galleryLightbox.classList.add('open');
  document.body.style.overflow = 'hidden';
});

function closeGalleryLightbox() {
  galleryLightbox.classList.remove('open');
  galleryLightboxImage.src = '';
  document.body.style.overflow = '';
}

galleryLightboxClose.addEventListener('click', closeGalleryLightbox);

galleryLightbox.addEventListener('click', event => {
  if (event.target === galleryLightbox) {
    closeGalleryLightbox();
  }
});

document.addEventListener('keydown', event => {
  if (event.key === 'Escape') {
    closeGalleryLightbox();
  }
});