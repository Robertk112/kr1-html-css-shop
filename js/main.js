// ==========================================
// Модальное окно заявки
// ==========================================

// Получаем модальное окно по id.
const orderDialog = document.getElementById('order-dialog');

// Получаем все кнопки заказа в карточках товаров.
const orderButtons = document.querySelectorAll('.product-card__button');

// Получаем кнопки закрытия модального окна.
const closeDialogButton = document.getElementById('close-order-dialog');       // нижняя «Отмена»
const closeDialogButtonTop = document.getElementById('close-order-dialog-top'); // крестик в шапке

// Получаем скрытое поле, в которое будет записан выбранный товар.
const selectedProductInput = document.getElementById('selected-product');

// Получаем форму заявки.
const orderForm = document.getElementById('order-form');

// Получаем сообщение об успешной отправке.
const successMessage = document.getElementById('success-message');

// ------------------------------------------
// Открытие модального окна по кнопкам «Заказать»
// ------------------------------------------
orderButtons.forEach((button) => {
  button.addEventListener('click', () => {
    // Получаем название товара из data-атрибута.
    const productName = button.dataset.product;

    // Записываем название товара в скрытое поле формы.
    if (selectedProductInput) {
      selectedProductInput.value = productName;
    }

    // Открываем модальное окно.
    if (orderDialog) {
      orderDialog.showModal();
    }
  });
});

// ------------------------------------------
// Закрытие модального окна — нижняя кнопка «Отмена»
// ------------------------------------------
if (closeDialogButton && orderDialog) {
  closeDialogButton.addEventListener('click', () => {
    orderDialog.close();
  });
}

// ------------------------------------------
// Закрытие модального окна — крестик в шапке
// ------------------------------------------
if (closeDialogButtonTop && orderDialog) {
  closeDialogButtonTop.addEventListener('click', () => {
    orderDialog.close();
  });
}

// ------------------------------------------
// Закрытие модального окна — клик по backdrop
// (по клику вне содержимого окна)
// ------------------------------------------
if (orderDialog) {
  orderDialog.addEventListener('click', (event) => {
    // Если клик пришёлся ровно на <dialog>, а не на его дочерние элементы —
    // значит, пользователь кликнул по затемнённому фону.
    if (event.target === orderDialog) {
      orderDialog.close();
    }
  });
}

// ------------------------------------------
// Закрытие модального окна — клавиша Esc
// (работает «из коробки» у <dialog>, но оставим для надёжности)
// ------------------------------------------
if (orderDialog) {
  orderDialog.addEventListener('cancel', (event) => {
    // По умолчанию <dialog> уже закрывается по Esc.
    // Здесь можно добавить свои действия, если понадобится.
  });
}

// ------------------------------------------
// Обработка отправки формы
// ------------------------------------------
if (orderForm) {
  orderForm.addEventListener('submit', (event) => {
    // Отменяем стандартную отправку формы,
    // потому что backend пока не подключён.
    event.preventDefault();

    // Сбрасываем предыдущие признаки ошибок.
    const formElements = Array.from(orderForm.elements);

    formElements.forEach((element) => {
      if (element.willValidate) {
        element.removeAttribute('aria-invalid');
      }
    });

    // Проверяем встроенные HTML-ограничения формы.
    if (!orderForm.checkValidity()) {
      formElements.forEach((element) => {
        if (element.willValidate && !element.checkValidity()) {
          element.setAttribute('aria-invalid', 'true');
        }
      });

      // Показываем стандартные сообщения браузера.
      orderForm.reportValidity();
      return;
    }

    // Показываем сообщение об успешной отправке.
    if (successMessage) {
      successMessage.hidden = false;
    }

    // Очищаем форму.
    orderForm.reset();

    // Закрываем модальное окно.
    if (orderDialog) {
      orderDialog.close();
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
    thumb.addEventListener('click', () => {
      const img = thumb.querySelector('img');
      if (!img) return;

      // Меняем главное изображение на выбранное.
      mainImage.src = img.src;
      mainImage.alt = img.alt;

      // Переключаем активный класс.
      thumbs.forEach((t) => t.classList.remove('product-details__thumb--active'));
      thumb.classList.add('product-details__thumb--active');
    });
  });
}