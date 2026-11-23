const orderModal = document.getElementById('order-dialog');
const orderForm = document.getElementById('order-form');
const successMessage = document.getElementById('success-message');
const orderProduct = document.getElementById('order-product');

const orderParams = new URLSearchParams(location.search);
const currency = new Intl.NumberFormat('ru-RU', { style: 'currency', currency: 'RUB', maximumFractionDigits: 0 });

if (orderProduct && orderParams.get('product') === 'serrado') {
  orderProduct.value = 'Бразилия Серрадо';
  document.getElementById('order-topic').value = 'product';

  const quantity = Number(orderParams.get('quantity'));
  if (Number.isInteger(quantity) && quantity >= 1 && quantity <= 12) {
    const estimate = document.getElementById('order-estimate');
    estimate.textContent = 'Бразилия Серрадо · упаковок: ' + quantity + ' · итого ' + currency.format(quantity * 1000);
    estimate.hidden = false;
    document.getElementById('order-comment').value = 'Количество упаковок: ' + quantity;
    orderForm.addEventListener('reset', () => { estimate.hidden = true; });
  }
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


const estimateForm = document.querySelector('.estimate-form');
if (estimateForm) {
  const quantity = estimateForm.elements.quantity;
  const total = document.getElementById('estimate-total');
  function updateEstimate() {
    total.value = quantity.validity.valid
      ? currency.format(quantity.valueAsNumber * Number(estimateForm.dataset.price))
      : 'Укажите от 1 до 12 упаковок';
  }
  quantity.addEventListener('input', updateEstimate);
  updateEstimate();
}

const nav = document.getElementById('site-nav');
const navToggle = document.querySelector('.site-nav-toggle');
const narrowScreen = matchMedia('(max-width: 767px)');
if (nav && navToggle) {
  function setMenu(open) {
    navToggle.setAttribute('aria-expanded', String(open));
    nav.hidden = narrowScreen.matches && !open;
  }
  function updateNavigation() {
    const focusOnToggle = document.activeElement === navToggle;
    navToggle.hidden = !narrowScreen.matches;
    setMenu(narrowScreen.matches && nav.contains(document.activeElement));
    if (focusOnToggle && navToggle.hidden) nav.querySelector('a').focus();
  }
  updateNavigation();
  narrowScreen.addEventListener('change', updateNavigation);
  navToggle.addEventListener('click', () => setMenu(nav.hidden));
  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape' && !document.querySelector('dialog[open]') && narrowScreen.matches && !nav.hidden) {
      setMenu(false);
      navToggle.focus();
    }
  });
  nav.addEventListener('click', (event) => {
    const link = event.target.closest('a');
    if (narrowScreen.matches && link?.hash && link.pathname === location.pathname) {
      setMenu(false);
      document.getElementById(link.hash.slice(1))?.focus();
    }
  });
}

const filters = document.querySelector('.filters-form');
if (filters) {
  const grid = document.querySelector('.catalog-products .products-grid');
  const status = document.getElementById('catalog-results');
  const actionsStatus = document.getElementById('catalog-actions-status');
  const from = document.getElementById('price-from');
  const to = document.getElementById('price-to');
  const favoriteFilter = filters.elements.favorites;
  const compareButton = document.getElementById('open-comparison');
  const compareDialog = document.getElementById('comparison-dialog');
  const compareGrid = document.getElementById('comparison-grid');
  const categoryNames = new Map(Array.from(filters.elements.category, (input) => [
    input.value, input.closest('label').textContent.trim()
  ]));
  const products = Array.from(grid.querySelectorAll('.product-card'), (card) => ({
    id: card.id,
    name: card.querySelector('.product-card__title').textContent.trim(),
    description: card.querySelector('.product-card__description').textContent.trim(),
    category: card.dataset.category,
    price: Number(card.dataset.price),
    column: card.closest('.product-column'),
    favorite: card.querySelector('[data-favorite]'),
    compare: card.querySelector('[data-compare]')
  }));

  const storageKey = 'roastlab.catalog.favorites.v1';
  const favorites = new Set();
  try {
    const saved = JSON.parse(localStorage.getItem(storageKey) || '[]');
    if (Array.isArray(saved)) {
      for (const product of products) {
        if (saved.includes(product.id)) favorites.add(product.id);
      }
    }
  } catch {
    // Избранное остаётся доступным в текущей вкладке.
  }

  const comparison = new Set();
  let currentSort = 'default';
  const sorts = {
    'price-up': (a, b) => a.price - b.price,
    'price-down': (a, b) => b.price - a.price,
    name: (a, b) => a.name.localeCompare(b.name, 'ru')
  };
  const normalize = (text) => text.toLocaleLowerCase('ru').replaceAll('ё', 'е');

  function updateCatalog() {
    const data = new FormData(filters);
    const min = from.value === '' ? 0 : from.valueAsNumber;
    const max = to.value === '' ? Infinity : to.valueAsNumber;
    to.setCustomValidity(max < min ? 'Верхняя граница цены должна быть не ниже нижней.' : '');
    if (!filters.checkValidity()) return;

    const terms = normalize(data.get('query').trim()).split(/\s+/).filter(Boolean);
    const categories = data.getAll('category');
    const sort = data.get('sort');
    if (sort !== currentSort) {
      const ordered = sorts[sort] ? [...products].sort(sorts[sort]) : products;
      grid.append(...ordered.map((product) => product.column));
      currentSort = sort;
    }

    let count = 0;
    for (const product of products) {
      const searchable = normalize([product.name, product.description, categoryNames.get(product.category)].join(' '));
      const visible = terms.every((term) => searchable.includes(term))
        && (!categories.length || categories.includes(product.category))
        && product.price >= min && product.price <= max
        && (!favoriteFilter.checked || favorites.has(product.id));
      product.column.hidden = !visible;
      if (visible) count++;
    }
    status.textContent = count ? 'Найдено товаров: ' + count : 'По этим условиям ничего не найдено.';
  }

  function updateComparison() {
    compareButton.textContent = 'Сравнить (' + comparison.size + '/3)';
    compareButton.disabled = comparison.size < 2;
  }

  for (const product of products) {
    product.favorite.setAttribute('aria-label', 'В избранное: ' + product.name);
    product.favorite.setAttribute('aria-pressed', String(favorites.has(product.id)));
    product.compare.setAttribute('aria-label', 'Сравнить: ' + product.name);

    product.favorite.addEventListener('click', () => {
      const selected = !favorites.delete(product.id);
      if (selected) favorites.add(product.id);
      product.favorite.setAttribute('aria-pressed', String(selected));
      actionsStatus.textContent = selected ? 'Товар добавлен в избранное.' : 'Товар убран из избранного.';
      try {
        localStorage.setItem(storageKey, JSON.stringify([...favorites]));
      } catch {
        actionsStatus.textContent += ' Изменение сохранено только в этой вкладке.';
      }
      if (!selected && favoriteFilter.checked) favoriteFilter.focus();
      updateCatalog();
    });

    product.compare.addEventListener('click', () => {
      if (!comparison.has(product.id) && comparison.size === 3) {
        actionsStatus.textContent = 'Для сравнения можно выбрать три товара. Снимите отметку с одного из выбранных.';
        return;
      }
      const selected = !comparison.delete(product.id);
      if (selected) comparison.add(product.id);
      product.compare.setAttribute('aria-pressed', String(selected));
      actionsStatus.textContent = selected ? 'Товар выбран для сравнения.' : 'Товар убран из сравнения.';
      updateComparison();
    });
  }

  compareButton.addEventListener('click', () => {
    compareGrid.replaceChildren();
    for (const product of products.filter(({ id }) => comparison.has(id))) {
      const item = document.createElement('article');
      const heading = document.createElement('h3');
      const details = document.createElement('dl');
      heading.textContent = product.name;
      for (const [label, value] of [
        ['Цена', currency.format(product.price)],
        ['Категория', categoryNames.get(product.category)],
        ['Описание', product.description]
      ]) {
        const term = document.createElement('dt');
        const definition = document.createElement('dd');
        term.textContent = label;
        definition.textContent = value;
        details.append(term, definition);
      }
      item.append(heading, details);
      compareGrid.append(item);
    }
    compareDialog.showModal();
  });

  filters.addEventListener('input', updateCatalog);
  filters.addEventListener('submit', (event) => {
    event.preventDefault();
    updateCatalog();
    filters.reportValidity();
  });
  filters.addEventListener('reset', () => setTimeout(updateCatalog, 0));
  updateCatalog();
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
