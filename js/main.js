// ==========================================
// 0. ОБЩИЕ УТИЛИТЫ ВАЛИДАЦИИ И ОШИБОК
// ==========================================
const ERROR_MESSAGES = {
  valueMissing: 'Заполните это поле.',
  typeMismatch: 'Проверьте формат введённых данных.',
  patternMismatch: 'Данные не соответствуют требуемому формату.',
  tooShort: 'Слишком короткое значение.',
  tooLong: 'Слишком длинное значение.',
  rangeUnderflow: 'Значение меньше допустимого.',
  rangeOverflow: 'Значение больше допустимого.',
  stepMismatch: 'Недопустимое значение шага.',
  badInput: 'Некорректное значение.',
  customError: 'Некорректное значение.'
};

// Человеко-понятные названия полей (по name)
const FIELD_LABELS = {
  name: 'Имя',
  email: 'E-mail',
  phone: 'Телефон',
  date: 'Дата связи',
  topic: 'Тема заявки',
  comment: 'Комментарий',
  agreement: 'Согласие на обработку данных',
  rating: 'Оценка',
  reviewProduct: 'Товар',
  reviewText: 'Текст отзыва'
};

function getFieldLabel(field) {
  const name = field.getAttribute('name') || '';
  if (FIELD_LABELS[name]) return FIELD_LABELS[name];
  const label = field.closest('.form-field')?.querySelector('.form-field__label');
  return label ? label.textContent.trim().replace(/:$/, '') : 'Поле';
}

function getFieldErrorMessage(field) {
  const v = field.validity;
  if (!v) return null;

  if (v.valueMissing) {
    return field.type === 'checkbox'
      ? 'Отметьте этот пункт.'
      : ERROR_MESSAGES.valueMissing;
  }

  if (field.type === 'email' && (v.typeMismatch || v.badInput)) {
    return 'Введите корректный e-mail, например example@mail.ru.';
  }

  if (field.type === 'tel' && v.patternMismatch) {
    return 'Введите телефон в формате +7 (900) 000-00-00.';
  }

  if (field.type === 'number') {
    if (v.badInput) return 'Введите число.';
    if (v.rangeUnderflow) return `Минимальное значение: ${field.min}.`;
    if (v.rangeOverflow) return `Максимальное значение: ${field.max}.`;
  }

  if (v.tooShort) {
    return `Минимум ${field.minLength} символов (введено ${field.value.length}).`;
  }

  if (v.tooLong) {
    return `Максимум ${field.maxLength} символов.`;
  }

  if (v.patternMismatch) {
    return ERROR_MESSAGES.patternMismatch;
  }

  if (v.typeMismatch) {
    return ERROR_MESSAGES.typeMismatch;
  }

  for (const key of Object.keys(ERROR_MESSAGES)) {
    if (v[key]) return ERROR_MESSAGES[key];
  }

  return 'Проверьте значение поля.';
}

function ensureErrorElement(fieldContainer) {
  let errorEl = fieldContainer.querySelector('.form-field__error');
  if (!errorEl) {
    errorEl = document.createElement('span');
    errorEl.className = 'form-field__error';
    errorEl.setAttribute('role', 'alert');
    fieldContainer.appendChild(errorEl);
  }
  return errorEl;
}

function clearFieldError(field) {
  const container = field.closest('.form-field');
  if (!container) return;
  container.classList.remove('has-error');
  field.removeAttribute('aria-invalid');
  const errorEl = container.querySelector('.form-field__error');
  if (errorEl) errorEl.textContent = '';
}

function setFieldError(field, message) {
  const container = field.closest('.form-field');
  if (!container) return;
  container.classList.add('has-error');
  field.setAttribute('aria-invalid', 'true');
  const errorEl = ensureErrorElement(container);
  errorEl.textContent = message;
}

function getErrorSummary(form) {
  let summary = form.querySelector('.form-errors-summary');
  if (!summary) {
    summary = document.createElement('div');
    summary.className = 'form-errors-summary';
    summary.setAttribute('role', 'alert');
    form.insertBefore(summary, form.firstChild);
  }
  return summary;
}

function hideErrorSummary(form) {
  const summary = form.querySelector('.form-errors-summary');
  if (summary) {
    summary.classList.remove('is-visible');
    summary.textContent = '';
  }
}

/**
 * Валидирует форму, подсвечивает поля и выводит сводку ошибок.
 * @returns {boolean} валидна ли форма
 */
function validateForm(form) {
  const fields = Array.from(form.elements).filter(
    (el) => el.willValidate && el.type !== 'submit' && el.type !== 'button'
  );

  const errors = [];

  fields.forEach((field) => {
    clearFieldError(field);
    if (!field.checkValidity()) {
      const msg = getFieldErrorMessage(field);
      setFieldError(field, msg);
      errors.push(`${getFieldLabel(field)}: ${msg}`);
    }
  });

  const summary = getErrorSummary(form);
  if (errors.length > 0) {
    summary.innerHTML =
      '<strong>Пожалуйста, исправьте следующие ошибки:</strong><ul>' +
      errors.map((e) => `<li>${e}</li>`).join('') +
      '</ul>';
    summary.classList.add('is-visible');
    return false;
  }

  hideErrorSummary(form);
  return true;
}

function setupLiveValidation(form) {
  form.addEventListener(
    'input',
    (event) => {
      const field = event.target;
      if (!field.willValidate) return;
      if (field.checkValidity()) {
        clearFieldError(field);
      } else if (field.closest('.form-field')?.classList.contains('has-error')) {
        setFieldError(field, getFieldErrorMessage(field));
      }
      // Пересчёт сводки, если она видна
      const summary = form.querySelector('.form-errors-summary');
      if (summary && summary.classList.contains('is-visible')) {
        validateForm(form);
      }
    },
    true
  );

  form.addEventListener(
    'change',
    (event) => {
      const field = event.target;
      if (!field.willValidate) return;
      if (field.checkValidity()) {
        clearFieldError(field);
      } else if (field.closest('.form-field')?.classList.contains('has-error')) {
        setFieldError(field, getFieldErrorMessage(field));
      }
      const summary = form.querySelector('.form-errors-summary');
      if (summary && summary.classList.contains('is-visible')) {
        validateForm(form);
      }
    },
    true
  );
}

// ==========================================
// 1. МОДАЛЬНОЕ ОКНО ЗАКАЗА
// ==========================================
const orderDialog = document.getElementById('order-dialog');
const orderButtons = document.querySelectorAll(
  '.product-card__button, .service-card__button'
);
const closeDialogButton = document.getElementById('close-order-dialog');
const selectedProductInput = document.getElementById('selected-product');

if (orderDialog && orderButtons.length > 0) {
  orderButtons.forEach((button) => {
    button.addEventListener('click', () => {
      const productName =
        button.dataset.product || button.dataset.service || '';
      if (selectedProductInput) {
        selectedProductInput.value = productName;
      }
      orderDialog.showModal();
    });
  });
}

if (closeDialogButton && orderDialog) {
  closeDialogButton.addEventListener('click', () => {
    orderDialog.close();
  });
}

// ==========================================
// 2. ОБРАБОТКА ФОРМЫ ЗАЯВКИ
// ==========================================
const orderForm = document.getElementById('order-form');
const successMessage = document.getElementById('success-message');

if (orderForm) {
  setupLiveValidation(orderForm);

  orderForm.addEventListener('submit', (event) => {
    event.preventDefault();

    if (!validateForm(orderForm)) {
      // Скроллим к первой ошибке
      const firstInvalid = orderForm.querySelector('[aria-invalid="true"]');
      if (firstInvalid) {
        firstInvalid.focus({ preventScroll: true });
        firstInvalid.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
      return;
    }

    // Показываем сообщение об успехе (только если есть на странице)
    if (successMessage) {
      successMessage.hidden = false;
      successMessage.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }

    orderForm.reset();
    hideErrorSummary(orderForm);
    orderForm
      .querySelectorAll('.form-field.has-error')
      .forEach((el) => el.classList.remove('has-error'));
    orderForm
      .querySelectorAll('[aria-invalid="true"]')
      .forEach((el) => el.removeAttribute('aria-invalid'));

    if (orderDialog) orderDialog.close();
  });

  // Кнопка очистки формы
  const resetButton = orderForm.querySelector('[data-reset]');
  if (resetButton) {
    resetButton.addEventListener('click', () => {
      orderForm.reset();
      hideErrorSummary(orderForm);
      orderForm
        .querySelectorAll('.form-field.has-error')
        .forEach((el) => el.classList.remove('has-error'));
      orderForm
        .querySelectorAll('[aria-invalid="true"]')
        .forEach((el) => el.removeAttribute('aria-invalid'));
      orderForm
        .querySelectorAll('.form-field__error')
        .forEach((el) => (el.textContent = ''));
      const firstField = orderForm.querySelector(
        '.form-field__input, .form-field__select, .form-field__textarea'
      );
      if (firstField) firstField.focus();
    });
  }
}

// ==========================================
// 3. КНОПКА "ОСТАВИТЬ ОТЗЫВ"
// ==========================================
const reviewButton = document.getElementById('reviewButton');

if (reviewButton && orderDialog) {
  reviewButton.addEventListener('click', () => {
    if (selectedProductInput) selectedProductInput.value = '';
    orderDialog.showModal();
  });
}

// ==========================================
// 4. ФИЛЬТРЫ КАТАЛОГА
// ==========================================
const filtersForm = document.querySelector('.filters-form');

if (filtersForm) {
  filtersForm.addEventListener('submit', (event) => {
    event.preventDefault();

    const checkedCategories = Array.from(
      filtersForm.querySelectorAll('input[name="category"]:checked')
    ).map((cb) => cb.value);

    const isAllSelected = checkedCategories.includes('all');
    const priceFrom =
      parseInt(filtersForm.querySelector('#price-from').value) || 0;
    const priceTo =
      parseInt(filtersForm.querySelector('#price-to').value) || Infinity;

    document.querySelectorAll('.product-card').forEach((card) => {
      const cardPrice = parseInt(card.dataset.price) || 0;
      const cardCategory = card.dataset.category;

      const matchesCategory =
        isAllSelected || checkedCategories.includes(cardCategory);
      const matchesPrice = cardPrice >= priceFrom && cardPrice <= priceTo;

      card.style.display =
        matchesCategory && matchesPrice ? '' : 'none';
    });
  });
}

// ==========================================
// 5. ВЕРСИЯ ТЕМЫ ДЛЯ ЛОКАЛЬНЫХ ФАЙЛОВ (ЧЕРЕЗ ХЭШ #)
// ==========================================
const themeToggleBtn = document.getElementById('themeToggle');
const htmlElement = document.documentElement;

function applyTheme(isDark) {
  if (isDark) {
    htmlElement.setAttribute('data-theme', 'dark');
    if (themeToggleBtn) themeToggleBtn.innerHTML = '☀️';
  } else {
    htmlElement.removeAttribute('data-theme');
    if (themeToggleBtn) themeToggleBtn.innerHTML = '🌙';
  }

  document.querySelectorAll('a').forEach((link) => {
    const href = link.getAttribute('href');
    if (
      href &&
      href.endsWith('.html') ||
      (href && !href.startsWith('http') && !href.startsWith('#'))
    ) {
      const cleanHref = href.split('#')[0];
      link.setAttribute('href', `${cleanHref}#${isDark ? 'dark' : 'light'}`);
    }
  });
}

let isDark = window.location.hash === '#dark';
applyTheme(isDark);

if (themeToggleBtn) {
  themeToggleBtn.addEventListener('click', () => {
    const currentIsDark = htmlElement.getAttribute('data-theme') === 'dark';
    const newIsDark = !currentIsDark;
    window.location.hash = newIsDark ? 'dark' : 'light';
    applyTheme(newIsDark);
  });
}

window.addEventListener('hashchange', () => {
  applyTheme(window.location.hash === '#dark');
});

// ==========================================
// 6. МОДАЛЬНОЕ ОКНО С ДЕТАЛЯМИ ТОВАРА
// ==========================================
const productDetailsDialog = document.getElementById(
  'product-details-dialog'
);
const detailsButtons = document.querySelectorAll(
  '.product-card__details-button'
);
const closeDetailsButton = document.getElementById(
  'close-product-details'
);
const productDetailsImage = document.getElementById(
  'product-details-image'
);
const productDetailsTitle = document.getElementById(
  'product-details-title'
);
const productDetailsPrice = document.getElementById(
  'product-details-price'
);
const productDetailsDescription = document.getElementById(
  'product-details-description'
);
const productDetailsOrderButton = document.getElementById(
  'product-details-order'
);

let currentProductInDetails = '';

if (productDetailsDialog && detailsButtons.length > 0) {
  detailsButtons.forEach((button) => {
    button.addEventListener('click', () => {
      const card = button.closest('.product-card');
      if (!card) return;

      const title = card.dataset.title || 'Товар';
      const image = card.dataset.image || '';
      const price = card.dataset.price || '0';
      const description =
        card.dataset.fullDescription || 'Описание отсутствует.';

      if (productDetailsImage) {
        productDetailsImage.src = image;
        productDetailsImage.alt = title;
      }
      if (productDetailsTitle) productDetailsTitle.textContent = title;
      if (productDetailsPrice)
        productDetailsPrice.textContent = `Цена: ${price} руб.`;
      if (productDetailsDescription)
        productDetailsDescription.textContent = description;

      currentProductInDetails = title;
      productDetailsDialog.showModal();
    });
  });
}

if (closeDetailsButton && productDetailsDialog) {
  closeDetailsButton.addEventListener('click', () => {
    productDetailsDialog.close();
  });
}

if (productDetailsOrderButton && orderDialog) {
  productDetailsOrderButton.addEventListener('click', () => {
    productDetailsDialog.close();
    if (selectedProductInput) {
      selectedProductInput.value = currentProductInDetails;
    }
    orderDialog.showModal();
  });
}

// ==========================================
// 7. КНОПКА "НАВЕРХ"
// ==========================================
const scrollTopButton = document.getElementById('scrollToTop');

if (scrollTopButton) {
  const SCROLL_THRESHOLD = 300;

  const toggleScrollTopButton = () => {
    if (window.scrollY > SCROLL_THRESHOLD) {
      scrollTopButton.classList.add('is-visible');
    } else {
      scrollTopButton.classList.remove('is-visible');
    }
  };

  window.addEventListener('scroll', toggleScrollTopButton, {
    passive: true
  });
  toggleScrollTopButton();

  scrollTopButton.addEventListener('click', () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  });
}

// ==========================================
// 8. FAQ — аккордеон (закрываем остальные при открытии одного)
// ==========================================
const faqItems = document.querySelectorAll('.faq__item');

if (faqItems.length > 0) {
  faqItems.forEach((item) => {
    item.addEventListener('toggle', () => {
      if (item.open) {
        faqItems.forEach((other) => {
          if (other !== item && other.open) other.open = false;
        });
      }
    });
  });
}