const translateWord = (word) => {
  const url = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=en&tl=uk&dt=t&q=${encodeURIComponent(word)}`;
  return new Promise((resolve, reject) => {
    fetch(url)
      .then(res => res.json())
      .then(res => resolve(res[0][0][0]))
      .catch(err => reject(err));
  });
}

const showTranslationPopup = (selection, originalWord, translation) => {
  const rect = selection.getRangeAt(0).getBoundingClientRect();

  const existingPopup = document.querySelector(".en-uk-addon__popup");
  if (existingPopup) existingPopup.remove();

  const popup = document.createElement("div");
  popup.className = "en-uk-addon__popup";
  popup.innerHTML = `<strong>${originalWord}:</strong></br>${translation}`;
  document.body.appendChild(popup);

  const left = rect.left + rect.width / 2 - popup.offsetWidth / 2;
  const top = rect.top + rect.height + 12;

  popup.style.left = left + "px";
  popup.style.top = top + "px";

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

  setTimeout(() => {
    popup.remove();
    window.removeEventListener("scroll", removePopupOnScroll);
    document.removeEventListener("click", removePopupOnClickOutside);
  }, 5000);
};

document.addEventListener("keydown", async (event) => {
  if (event.code === "KeyT") {
    const selection = window.getSelection();
    const selectedText = selection.toString().trim();
    if (selectedText) {
      let translation = "";
      translateWord(selectedText)
        .then(data => {
          translation = data
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
})