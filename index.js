const languages = ["en", "uk", "ru"];
let options = {
  iLang: "en",
  oLang: "uk",
}

const saveOptions = (options) => {
  chrome.storage.local.set({ languageOptions: options });
}

const loadOptions = () => {
  return new Promise((resolve) => {
    chrome.storage.local.get("languageOptions", (result) => {
      resolve(result.languageOptions || { iLang: "en", oLang: "uk" });
    });
  });
}

const translateWord = (word) => {
  const url = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=${options.iLang}&tl=${options.oLang}&dt=t&q=${encodeURIComponent(word)}`;
  return new Promise((resolve, reject) => {
    fetch(url)
      .then(res => res.json())
      .then(res => resolve(res[0]))
      .catch(err => reject(err));
  });
}

const addClosePopupListeners = (popup, timeout = undefined) => {
  const removePopupOnScroll = () => {
    popup.remove();
    window.removeEventListener("scroll", removePopupOnScroll);
  };
  const removePopupOnClickOutside = (event) => {
    if (!popup.contains(event.target)) {
      popup.remove();
      document.removeEventListener("click", removePopupOnClickOutside);
    }
  };

  window.addEventListener("scroll", removePopupOnScroll);
  document.addEventListener("click", removePopupOnClickOutside);
  
  if (timeout === undefined || timeout <= 0) return;

  setTimeout(() => {
    popup.remove();
    window.removeEventListener("scroll", removePopupOnScroll);
    document.removeEventListener("click", removePopupOnClickOutside);
  }, timeout);
}

const showTranslationPopup = (selection, originalWord, translation) => {
  const rect = selection.getRangeAt(0).getBoundingClientRect();

  const existingPopup = document.querySelector(".en-uk-addon__popup");
  if (existingPopup) existingPopup.remove();
  
  const formatText = (text) => text.replace(/(\r\n|\n|\r)/g, "<br>");

  const popup = document.createElement("div");
  popup.className = "en-uk-addon__popup";
  popup.innerHTML = `<strong>${formatText(originalWord)}:</strong></br>${formatText(translation)}`;
  document.body.appendChild(popup);

  const left = rect.left + rect.width / 2 - popup.offsetWidth / 2;
  const top = rect.top + rect.height + 12;

  popup.style.left = left + "px";
  popup.style.top = top + "px";
  
  addClosePopupListeners(popup, 5000);

};

const showLanguagePopup = () => {
  const existingPopup = document.querySelector(".en-uk-addon__popup");
  if (existingPopup) existingPopup.remove();

  const popup = document.createElement("div");
  popup.className = "en-uk-addon__popup";

  const createLanguageSelector = (id, selectedLang) => {
    const select = document.createElement("select");
    select.id = id;

    languages.forEach(lang => {
      const option = document.createElement("option");
      option.value = lang;
      option.textContent = lang;
      if (lang === selectedLang) option.selected = true;
      select.appendChild(option);
    });

    select.addEventListener("change", (e) => {
      options[id] = e.target.value;
      saveOptions(options);
    });

    return select;
  };

  const iSelect = createLanguageSelector("iLang", options.iLang);
  const oSelect = createLanguageSelector("oLang", options.oLang);

  popup.appendChild(iSelect);

  const separator = document.createElement("span");
  separator.textContent = " → ";
  popup.appendChild(separator);

  popup.appendChild(oSelect);

  popup.style.right = "20px";
  popup.style.top ="20px";

  document.body.appendChild(popup);

  addClosePopupListeners(popup);
};


const loadOptionsDelegate = () => {
  loadOptions()
    .then((data) => {
      if (data) options = data;
    });
}

window.addEventListener("load", loadOptionsDelegate);
window.addEventListener("focus", loadOptionsDelegate);

document.addEventListener("keydown", (event) => {
  if (event.code === "KeyT") {
    const selection = window.getSelection();
    const selectedText = selection.toString().trim();
    if (selectedText) {
      let translation = "";
      translateWord(selectedText)
        .then(data => {
          translation = data.map(item => item[0]).join('');
        })
        .catch(err => {
          translation = "Помилка перекладу! :(";
          console.log("Word Translater Addon Err", err);
        })
        .finally(() => {
          showTranslationPopup(selection, selectedText, translation);
        });
    }
  }
  if (event.ctrlKey && event.code === "KeyQ") {
    event.preventDefault();
    showLanguagePopup();
  }
});