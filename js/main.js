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
  document.addEventListener('click', (event) => {
    const button = event.target.closest('button[data-product]');
    if (!button) return;
    const productName = button.dataset.product;
    document.getElementById('selected-product').value = productName;
    document.getElementById('selected-product-name').textContent = productName;
    successMessage.hidden = true;
    orderModal.showModal();
  });
  for (const button of orderModal.querySelectorAll('[data-close-dialog]')) {
    button.addEventListener('click', () => orderModal.close());
  }
}

if (orderForm) {
  const fields = [...orderForm.elements].filter((field) => field.id && field.willValidate);
  const errors = new Map();

  function clearError(field) {
    const error = errors.get(field);
    if (!error) return;

    const descriptions = (field.getAttribute('aria-describedby') || '').split(/\s+/)
      .filter((id) => id && id !== error.id);
    if (descriptions.length) field.setAttribute('aria-describedby', descriptions.join(' '));
    else field.removeAttribute('aria-describedby');
    field.removeAttribute('aria-invalid');
    error.remove();
    errors.delete(field);
  }

  function showError(field) {
    const { validity } = field;
    let message = field.validationMessage;
    if (validity.valueMissing) {
      message = field.type === 'checkbox' ? 'Поставьте отметку о согласии.' : 'Заполните это поле.';
      if (field.tagName === 'SELECT') message = 'Выберите вариант из списка.';
    } else if (validity.typeMismatch && field.type === 'email') {
      message = 'Введите адрес в формате name@example.com.';
    } else if (validity.patternMismatch && field.type === 'tel') {
      message = 'Введите телефон в формате +7 (900) 000-00-00.';
    } else if (validity.tooShort) {
      message = 'Введите не менее ' + field.minLength + ' символов.';
    }

    let error = errors.get(field);
    if (!error) {
      error = document.createElement('p');
      error.className = 'order-form__error';
      error.id = field.id + '-error';
      const container = field.closest('.field, .order-form__agreement');
      if (container?.classList.contains('order-form__agreement')) container.after(error);
      else if (container) container.append(error);
      else field.after(error);
      const descriptions = field.getAttribute('aria-describedby') || '';
      field.setAttribute('aria-describedby', (descriptions + ' ' + error.id).trim());
      field.setAttribute('aria-invalid', 'true');
      errors.set(field, error);
    }
    error.textContent = message;
  }

  orderForm.addEventListener('reset', () => {
    successMessage.hidden = true;
    orderForm.classList.remove('was-validated');
    for (const field of fields) clearError(field);
  });

  orderForm.addEventListener('input', ({ target }) => {
    if (!errors.has(target)) return;
    if (target.validity.valid) clearError(target);
    else showError(target);
  });

  orderForm.addEventListener('submit', (event) => {
    event.preventDefault();

    let firstInvalid;
    for (const field of fields) {
      if (field.validity.valid) clearError(field);
      else {
        showError(field);
        firstInvalid ??= field;
      }
    }

    if (firstInvalid) {
      successMessage.hidden = true;
      orderForm.classList.add('was-validated');
      firstInvalid.focus();
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
