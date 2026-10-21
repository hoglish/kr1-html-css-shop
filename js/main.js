// ==========================================
// 1. МОДАЛЬНОЕ ОКНО ЗАКАЗА
// ==========================================
const orderDialog = document.getElementById('order-dialog');
const orderButtons = document.querySelectorAll('.product-card__button');
const closeDialogButton = document.getElementById('close-order-dialog');
const selectedProductInput = document.getElementById('selected-product');

if (orderDialog && orderButtons.length > 0) {
  orderButtons.forEach((button) => {
    button.addEventListener('click', () => {
      const productName = button.dataset.product;
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
  orderForm.addEventListener('submit', (event) => {
    event.preventDefault();
    const formElements = Array.from(orderForm.elements);

    formElements.forEach((element) => {
      if (element.willValidate) element.removeAttribute('aria-invalid');
    });

    if (!orderForm.checkValidity()) {
      formElements.forEach((element) => {
        if (element.willValidate && !element.checkValidity()) {
          element.setAttribute('aria-invalid', 'true');
        }
      });
      orderForm.reportValidity();
      return;
    }

    if (successMessage) successMessage.hidden = false;
    orderForm.reset();
    if (orderDialog) orderDialog.close();
  });
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
    ).map(cb => cb.value);

    const isAllSelected = checkedCategories.includes('all');
    const priceFrom = parseInt(filtersForm.querySelector('#price-from').value) || 0;
    const priceTo = parseInt(filtersForm.querySelector('#price-to').value) || Infinity;

    document.querySelectorAll('.product-card').forEach(card => {
      const cardPrice = parseInt(card.dataset.price) || 0;
      const cardCategory = card.dataset.category;
      
      const matchesCategory = isAllSelected || checkedCategories.includes(cardCategory);
      const matchesPrice = cardPrice >= priceFrom && cardPrice <= priceTo;

      card.style.display = (matchesCategory && matchesPrice) ? '' : 'none';
    });
  });
}

// ==========================================
// 5. ВЕРСИЯ ТЕМЫ ДЛЯ ЛОКАЛЬНЫХ ФАЙЛОВ (ЧЕРЕЗ ХЭШ #)
// ==========================================
const themeToggleBtn = document.getElementById('themeToggle');
const htmlElement = document.documentElement;

// 1. Функция применения темы
function applyTheme(isDark) {
  if (isDark) {
    htmlElement.setAttribute('data-theme', 'dark');
    if (themeToggleBtn) themeToggleBtn.innerHTML = '☀️';
  } else {
    htmlElement.removeAttribute('data-theme');
    if (themeToggleBtn) themeToggleBtn.innerHTML = '🌙';
  }

  // Переписываем все ссылки на странице, чтобы они сохраняли хэш темы
  document.querySelectorAll('a').forEach(link => {
    const href = link.getAttribute('href');
    // Модифицируем только внутренние ссылки проекта на .html
    if (href && href.endsWith('.html') || (href && !href.startsWith('http') && !href.startsWith('#'))) {
      const cleanHref = href.split('#')[0]; // Убираем старый хэш
      link.setAttribute('href', `${cleanHref}#${isDark ? 'dark' : 'light'}`);
    }
  });
}

// 2. Определяем тему при загрузке (из хэша адресной строки)
// Если в ссылке написано index.html#dark — включит темную тему
let isDark = window.location.hash === '#dark';
applyTheme(isDark);

// 3. Логика кнопки переключения
if (themeToggleBtn) {
  themeToggleBtn.addEventListener('click', () => {
    const currentIsDark = htmlElement.getAttribute('data-theme') === 'dark';
    const newIsDark = !currentIsDark;
    
    // Меняем хэш в адресной строке текущей страницы
    window.location.hash = newIsDark ? 'dark' : 'light';
    applyTheme(newIsDark);
  });
}

// 4. Отслеживаем, если пользователь нажал "Назад" в браузере
window.addEventListener('hashchange', () => {
  applyTheme(window.location.hash === '#dark');
});


