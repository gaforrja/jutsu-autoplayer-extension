document.addEventListener("DOMContentLoaded", () => {
  const settings = ["autoPlay", "skipIntro", "autoNext"];
  console.log("[Jut.su AutoPlayer] Загрузка popup.js");

  chrome.storage.sync.get(settings, (data) => {
    console.log("[Jut.su AutoPlayer] Получены настройки:", data);
    settings.forEach((key) => {
      const checkbox = document.getElementById(key);
      if (checkbox) {
        checkbox.checked = data[key] ?? true;
        console.log(`[Jut.su AutoPlayer] Слайдер ${key} установлен в ${checkbox.checked}`);
      } else {
        console.error(`[Jut.su AutoPlayer] Слайдер с id=${key} не найден`);
      }
    });
  });

  settings.forEach((key) => {
    const checkbox = document.getElementById(key);
    if (checkbox) {
      checkbox.addEventListener("change", () => {
        console.log(`[Jut.su AutoPlayer] Изменение настройки ${key} на ${checkbox.checked}`);
        chrome.storage.sync.set({ [key]: checkbox.checked });
      });
    }
  });
});