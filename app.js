
const BOOK_INDEX = ["books/novel-pertama/book.json"];
const state = { books: [], currentBook: null, chapterIndex: 0 };

const $ = selector => document.querySelector(selector);

const esc = value =>
    String(value ?? "").replace(/[&<>"']/g, character => ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#39;"
    }[character]));

function asset(book, path) {
    return path
        ? new URL(path, new URL(book._folder, location.href)).href
        : "";
}

async function loadBooks() {
    const loaded = await Promise.all(BOOK_INDEX.map(async path => {
        try {
            const response = await fetch(path);
            if (!response.ok) throw Error(response.status);

            const book = await response.json();

            if (!book.id || !book.title || !Array.isArray(book.chapters)) {
                throw Error("book.json tidak lengkap");
            }

            book._folder = path.slice(0, path.lastIndexOf("/") + 1);
            return book;
        } catch (error) {
            console.error("Tidak dapat memuat", path, error);
            return null;
        }
    }));

    state.books = loaded.filter(Boolean);
    renderHome(state.books);
}

function cover(book, className) {
    const source = asset(book, book.cover);

    return `<div class="book-cover ${className}">
        ${source ? `<img src="${esc(source)}" alt="Cover ${esc(book.title)}" onerror="this.remove()">` : ""}
        <span>${esc(book.title)}</span>
    </div>`;
}

function renderHome(books) {
    const featured = books.find(book => book.featured) || books[0];

    $("#catalogCount").textContent = `${books.length} karya`;

    $("#featuredContainer").innerHTML = featured
        ? `<article class="featured-card">
            ${cover(featured, "cover-small")}
            <div class="featured-info">
                <h3>${esc(featured.title)}</h3>
                <p>${esc(featured.synopsis || "Baca karya ini di SHOULY.")}</p>
                <button class="text-button" data-open="${esc(featured.id)}">Lihat →</button>
            </div>
        </article>`
        : `<div class="empty-state">Belum ada novel unggulan.</div>`;

    $("#bookGrid").innerHTML = books.length
        ? books.map(book => `
            <button class="book-tile" data-open="${esc(book.id)}">
                ${cover(book, "cover-grid")}
                <span>${esc(book.title)}</span>
            </button>
        `).join("")
        : `<div class="empty-state">Belum ada koleksi yang tersedia. Silakan kunjungi kembali nanti.</div>`;

    document.querySelectorAll("[data-open]").forEach(element => {
        element.addEventListener("click", () => openBook(element.dataset.open));
    });
}

function showPage(name) {
    ["home", "search", "detail", "reader"].forEach(page => {
        $(`#${page}Page`).classList.toggle("active", page === name);
    });

    scrollTo({ top: 0, behavior: "smooth" });
}

function openBook(id) {
    const book = state.books.find(item => item.id === id);
    if (!book) return;

    state.currentBook = book;

    const genres = (book.genre || [])
        .map(genre => `<span>${esc(genre)}</span>`)
        .join("");

    const chapters = book.chapters.map((chapter, index) => `
        <button class="chapter-item ${index >= 2 ? "is-hidden" : ""}" data-chapter="${index}">
            <span>${esc(chapter.title || `Bab ${index + 1}`)}</span>
            <span>Baca →</span>
        </button>
    `).join("");

    $("#detailContent").innerHTML =
        `<div class="detail-hero">
            ${cover(book, "cover-detail")}
            <h1>${esc(book.title)}</h1>
        </div>` +
        `<article class="detail-panel">
            <p class="meta-line">Penulis: <strong>${esc(book.author || "Tidak dicantumkan")}</strong></p>
            <p class="meta-line">Asal: <strong>${esc(book.origin || "Tidak dicantumkan")}</strong></p>
            <div class="tag-row">${genres || "<span>Novel</span>"}</div>
            <h2>Sinopsis</h2>
            <p class="synopsis-text" id="synopsisText">${esc(book.synopsis || "Sinopsis belum tersedia.")}</p>
            <button class="synopsis-toggle" id="synopsisToggle" type="button">Baca Selengkapnya ↓</button>
            <button class="primary-button full-button" id="startReading">Mulai Membaca</button>
        </article>` +
        `<section class="chapter-section">
            <h2>Daftar Bab</h2>
            <div class="chapter-list">${chapters}</div>
            ${book.chapters.length > 2
                ? `<button class="chapter-more" id="chapterMore" type="button">Lihat Semua Bab ↓</button>`
                : ""}
        </section>`;

    $("#startReading").addEventListener("click", () => readChapter(0));

    const synopsisText = $("#synopsisText");
    const synopsisToggle = $("#synopsisToggle");

    synopsisToggle.addEventListener("click", () => {
        const expanded = synopsisText.classList.toggle("expanded");

        synopsisToggle.textContent = expanded
            ? "Tampilkan Lebih Sedikit ↑"
            : "Baca Selengkapnya ↓";
    });

    const chapterMore = $("#chapterMore");

    if (chapterMore) {
        chapterMore.addEventListener("click", () => {
            const expanded = chapterMore.classList.toggle("expanded");

            document.querySelectorAll(".chapter-item.is-hidden").forEach(element => {
                element.classList.toggle("is-visible", expanded);
            });

            chapterMore.textContent = expanded
                ? "Tampilkan Lebih Sedikit ↑"
                : "Lihat Semua Bab ↓";
        });
    }

    document.querySelectorAll("[data-chapter]").forEach(element => {
        element.addEventListener("click", () => {
            readChapter(Number(element.dataset.chapter));
        });
    });

    showPage("detail");
}

async function readChapter(index) {
    const book = state.currentBook;

    if (!book || index < 0 || index >= book.chapters.length) return;

    const chapter = book.chapters[index];

    state.chapterIndex = index;

    $("#chapterNumber").textContent = `BAB ${String(index + 1).padStart(2, "0")}`;
    $("#chapterTitle").textContent = chapter.title || `Bab ${index + 1}`;
    $("#chapterBody").innerHTML = "<p>Memuat bab...</p>";

    try {
        const response = await fetch(asset(book, chapter.file));

        if (!response.ok) throw Error(response.status);

        $("#chapterBody").innerHTML = await response.text();
    } catch (error) {
        console.error(error);
        $("#chapterBody").innerHTML = "<p>Bab belum tersedia atau file tidak ditemukan.</p>";
    }

    $("#chapterProgress").textContent = `${index + 1} / ${book.chapters.length}`;
    $("#prevChapter").disabled = index === 0;
    $("#nextChapter").disabled = index === book.chapters.length - 1;

    showPage("reader");
}

$("#exploreButton").addEventListener("click", () => {
    $("#catalog").scrollIntoView({ behavior: "smooth" });
});

$("#detailBack").addEventListener("click", () => showPage("home"));
$("#readerBack").addEventListener("click", () => showPage("detail"));
$("#prevChapter").addEventListener("click", () => readChapter(state.chapterIndex - 1));
$("#nextChapter").addEventListener("click", () => readChapter(state.chapterIndex + 1));

function performSearch() {
    const query = $("#searchInput").value.trim();

    if (!query) return;

    const normalizedQuery = query.toLocaleLowerCase("id");

    const results = state.books.filter(book =>
        `${book.title} ${book.author || ""} ${(book.genre || []).join(" ")}`
            .toLocaleLowerCase("id")
            .includes(normalizedQuery)
    );

    $("#searchResultInfo").textContent =
        `${results.length} karya ditemukan untuk "${query}"`;

    $("#searchResultsGrid").innerHTML = results.length
        ? results.map(book => `
            <button class="book-tile" data-search-open="${esc(book.id)}">
                ${cover(book, "cover-grid")}
                <span>${esc(book.title)}</span>
            </button>
        `).join("")
        : `<div class="empty-state">
            Tidak ada karya yang ditemukan.
            Coba gunakan kata kunci lain.
        </div>`;

    document.querySelectorAll("[data-search-open]").forEach(element => {
        element.addEventListener("click", () => {
            closeSearch();
            openBook(element.dataset.searchOpen);
        });
    });

    showPage("search");
}

const topbar = $(".topbar");
const searchInput = $("#searchInput");

function closeSearch() {
    topbar.classList.remove("search-active");
    searchInput.value = "";
    $("#searchClear").style.visibility = "hidden";
    searchInput.blur();
}

searchInput.addEventListener("keydown", event => {
    if (event.key === "Enter") {
        event.preventDefault();
        performSearch();
    }

    if (event.key === "Escape") {
        closeSearch();
    }
});

$("#searchPageBack").addEventListener("click", () => {
    closeSearch();
    showPage("home");
});

searchInput.addEventListener("input", event => {
    $("#searchClear").style.visibility =
        event.target.value ? "visible" : "hidden";
});

$("#searchToggle").addEventListener("click", () => {
    topbar.classList.add("search-active");
    searchInput.focus();
});

$("#searchBack").addEventListener("click", closeSearch);

$("#searchClear").addEventListener("click", () => {
    searchInput.value = "";
    searchInput.dispatchEvent(new Event("input"));
    searchInput.focus();
});

loadBooks();
