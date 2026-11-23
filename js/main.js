const orderModal = document.getElementById('order-dialog');
const orderForm = document.getElementById('order-form');
const successMessage = document.getElementById('success-message');
const orderProduct = document.getElementById('order-product');

if (orderProduct && new URLSearchParams(location.search).get('product') === 'serrado') {
  orderProduct.value = 'Бразилия Серрадо';
  document.getElementById('order-topic').value = 'product';
}

if (orderModal) {
  for (const button of document.querySelectorAll('button[data-product]')) {
    button.addEventListener('click', () => {
      const productName = button.dataset.product;
      document.getElementById('selected-product').value = productName;
      document.getElementById('selected-product-name').textContent = productName;
      successMessage.hidden = true;
      orderModal.showModal();
    });
  }
  for (const button of orderModal.querySelectorAll('[data-close-dialog]')) {
    button.addEventListener('click', () => orderModal.close());
  }
}

if (orderForm) {
  orderForm.addEventListener('reset', () => {
    successMessage.hidden = true;
    orderForm.classList.remove('was-validated');
  });

  orderForm.addEventListener('submit', (event) => {
    event.preventDefault();

    if (!orderForm.checkValidity()) {
      successMessage.hidden = true;
      orderForm.classList.add('was-validated');
      orderForm.reportValidity();
      return;
    }

    orderForm.reset();
    successMessage.hidden = false;
    if (orderModal) orderModal.close();
  });
}

const filters = document.querySelector('.filters-form');

if (filters) {
  const cards = document.querySelectorAll('.catalog-products .product-card');
  const status = document.getElementById('catalog-results');
  const from = document.getElementById('price-from');
  const to = document.getElementById('price-to');

  function applyFilters(categories = [], min = 0, max = Infinity) {
    let count = 0;
    for (const card of cards) {
      const {category, price} = card.dataset;
      const matchesCategory = !categories.length || categories.includes(category);
      const isVisible = matchesCategory && Number(price) >= min && Number(price) <= max;
      card.closest('.product-column').hidden = !isVisible;
      if (isVisible) count++;
    }
    status.textContent = count ? `Найдено товаров: ${count}` : 'По этим условиям ничего не найдено.';
  }

  filters.addEventListener('submit', (event) => {
    event.preventDefault();
    if (!filters.reportValidity()) return;
    const min = from.value === '' ? 0 : from.valueAsNumber;
    const max = to.value === '' ? Infinity : to.valueAsNumber;
    if (max < min) {
      to.setCustomValidity('Верхняя граница цены должна быть не ниже нижней.');
      to.reportValidity();
      return;
    }
    applyFilters(new FormData(filters).getAll('category'), min, max);
  });
  filters.addEventListener('input', () => to.setCustomValidity(''));
  filters.addEventListener('reset', () => {
    to.setCustomValidity('');
    applyFilters();
  });
  applyFilters();
}

// ==========================================
// Галерея изображений в подробной карточке товара
// ==========================================

// Главное изображение товара.
const mainImage = document.getElementById('product-main-image');

// Все миниатюры.
const thumbs = document.querySelectorAll('.product-details__thumb');

if (mainImage && thumbs.length) {
  thumbs.forEach((thumb) => {
    const selectPhoto = () => {
      const img = thumb.querySelector('img');
      if (!img) return;

      // Меняем главное изображение на выбранное.
      mainImage.src = img.src;
      mainImage.alt = img.alt;

      // Переключаем активный класс.
      thumbs.forEach((t) => {
        t.classList.remove('product-details__thumb--active');
        t.querySelector('button').setAttribute('aria-pressed', 'false');
      });
      thumb.classList.add('product-details__thumb--active');
      thumb.querySelector('button').setAttribute('aria-pressed', 'true');
    };
    thumb.querySelector('button').addEventListener('click', selectPhoto);
  });
}
