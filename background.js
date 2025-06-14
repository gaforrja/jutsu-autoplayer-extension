chrome.runtime.onInstalled.addListener(() => {
  chrome.storage.sync.set({
    autoPlay: true,
    skipIntro: true,
    autoNext: true
  });
  console.log("[Jut.su AutoPlayer] Установлены настройки по умолчанию");
});

// Слушаем обновления вкладок
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (changeInfo.status === 'complete' && tab.url && tab.url.includes('jut.su')) {
    console.log("[Jut.su AutoPlayer] Обнаружена страница jut.su:", tab.url);
    chrome.storage.sync.get(["autoPlay", "skipIntro", "autoNext"], (config) => {
      config = {
        autoPlay: config.autoPlay ?? true,
        skipIntro: config.skipIntro ?? true,
        autoNext: config.autoNext ?? true
      };
      console.log("[Jut.su AutoPlayer] Конфигурация для вкладки:", config);

      chrome.scripting.executeScript({
        target: { tabId: tabId },
        function: autoPlayer,
        args: [config]
      }, () => {
        if (chrome.runtime.lastError) {
          console.error("[Jut.su AutoPlayer] Ошибка инъекции скрипта:", chrome.runtime.lastError.message);
        } else {
          console.log("[Jut.su AutoPlayer] Скрипт успешно инъецирован");
        }
      });
    });
  }
});

// Функция для взаимодействия с сайтом
function autoPlayer(config) {
  let introClicked = false;
  let nextEpisodeClicked = false;
  let playClicked = false;

  function log(...args) {
    console.log('[Jut.su AutoPlayer]', ...args);
  }

  log("Скрипт запущен на странице:", window.location.href);

  // Наблюдатель за изменениями DOM
  const observer = new MutationObserver(() => {
    if (config.skipIntro) {
      const skipIntroButton = document.querySelector('.vjs-overlay-bottom-left.vjs-overlay-skip-intro:not(.vjs-hidden)');
      if (skipIntroButton && skipIntroButton.offsetParent !== null && !introClicked) {
        skipIntroButton.click();
        introClicked = true;
        log("Заставка пропущена");
      }
    }

    if (config.autoNext && playClicked) {
      const nextEpisodeButton = document.querySelector('.vjs-overlay-bottom-right.vjs-overlay-skip-intro:not(.vjs-hidden)');
      if (nextEpisodeButton && nextEpisodeButton.offsetParent !== null && !nextEpisodeClicked) {
        nextEpisodeButton.click();
        nextEpisodeClicked = true;
        log("Следующая серия запущена");
      }
    }
  });

  observer.observe(document.body, {
    childList: true,
    subtree: true,
    attributes: true,
    attributeFilter: ['class', 'style']
  });

  // Функция для запуска видео
  function tryPlayVideo() {
    const video = document.querySelector('video#my-player_html5_api.vjs-tech');
    if (video && !playClicked && config.autoPlay) {
      video.play().then(() => {
        playClicked = true;
        log("Видео запущено");
      }).catch(err => {
        log("Ошибка при запуске видео:", err.message);
      });
    } else if (!video) {
      log("Элемент <video> не найден");
    }
  }

  // Периодическая проверка для автозапуска
  let attempts = 0;
  const maxAttempts = 40; // 20 секунд
  const interval = setInterval(() => {
    if (playClicked || attempts >= maxAttempts) {
      clearInterval(interval);
      if (!playClicked) log("Не удалось запустить видео после 20 секунд");
    } else {
      tryPlayVideo();
      attempts++;
    }
  }, 500);

  // Запуск видео через 1 секунду
  setTimeout(tryPlayVideo, 1000);

  // Обработка SPA-навигации
  window.addEventListener('popstate', () => {
    introClicked = false;
    nextEpisodeClicked = false;
    playClicked = false;
    setTimeout(tryPlayVideo, 3000);
    log("Навигация SPA, флаги сброшены");
  });
}