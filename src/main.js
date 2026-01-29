import i18next from 'i18next';
import * as yup from 'yup';
import axios from 'axios';
import './style.css';

// ---------- i18next ----------
i18next.init({
  lng: 'ru',
  resources: {
    ru: {
      translation: {
        form: {
          placeholder: 'Введите URL RSS',
          submit: 'Добавить',
        },
        messages: {
          success: 'RSS успешно загружен',
        },
        errors: {
          required: 'Не должно быть пустым',
          invalidUrl: 'Ссылка должна быть валидным URL',
          duplicate: 'RSS уже существует',
          parse: 'Ресурс не содержит валидный RSS',
          network: 'Ошибка сети',
        },
        buttons: {
          preview: 'Просмотр',
        },
      },
    },
  },
});

// ---------- yup ----------
yup.setLocale({
  string: {
    url: () => ({ key: 'errors.invalidUrl' }),
  },
  mixed: {
    required: () => ({ key: 'errors.required' }),
  },
});

// ---------- состояние ----------
const state = {
  feeds: [],
  posts: [],
  readPosts: new Set(),
};

// ---------- DOM ----------
const form = document.getElementById('rss-form');
const input = form.querySelector('input[name="url"]');
const feedsContainer = document.getElementById('feeds-container');
const postsContainer = document.getElementById('posts-container');
const feedback = document.createElement('div');
feedback.classList.add('mt-2');
form.append(feedback);

// placeholder и кнопка через i18next
input.placeholder = i18next.t('form.placeholder');
form.querySelector('button[type="submit"]').textContent = i18next.t('form.submit');

// ---------- прокси ----------
const buildProxyUrl = (url) =>
  `https://allorigins.hexlet.app/get?disableCache=true&url=${encodeURIComponent(url)}`;

// ---------- парсер RSS ----------
const parseRss = (xmlString) => {
  const parser = new DOMParser();
  const doc = parser.parseFromString(xmlString, 'application/xml');

  const feedTitle = doc.querySelector('channel > title')?.textContent;
  const feedDescription = doc.querySelector('channel > description')?.textContent;

  const items = doc.querySelectorAll('item');
  if (!feedTitle || !items.length) {
    const error = new Error('parse');
    throw error;
  }

  const posts = Array.from(items).map((item) => ({
    id: crypto.randomUUID(),
    title: item.querySelector('title')?.textContent,
    link: item.querySelector('link')?.textContent,
    description: item.querySelector('description')?.textContent,
  }));

  return { feedTitle, feedDescription, posts };
};

// ---------- рендер ----------
const renderFeeds = () => {
  feedsContainer.innerHTML = '';
  state.feeds.forEach((feed) => {
    const div = document.createElement('div');
    div.classList.add('card', 'mb-3', 'p-3');
    div.innerHTML = `
      <h5>${feed.title}</h5>
      <p>${feed.description}</p>
    `;
    feedsContainer.append(div);
  });
};

const renderPosts = () => {
  postsContainer.innerHTML = '';
  state.posts.forEach((post) => {
    const li = document.createElement('li');
    li.classList.add('list-group-item', 'd-flex', 'justify-content-between', 'align-items-start');
    if (!state.readPosts.has(post.id)) {
      li.classList.add('fw-bold');
    } else {
      li.classList.add('fw-normal');
    }

    const a = document.createElement('a');
    a.href = post.link;
    a.target = '_blank';
    a.textContent = post.title;

    const btn = document.createElement('button');
    btn.type = 'button';
    btn.classList.add('btn', 'btn-primary', 'btn-sm');
    btn.textContent = i18next.t('buttons.preview');

    btn.addEventListener('click', () => {
      state.readPosts.add(post.id);
      renderPosts();
      const modalTitle = document.getElementById('modalTitle');
      const modalBody = document.getElementById('modalBody');
      modalTitle.textContent = post.title;
      modalBody.textContent = post.description;
      const modalEl = document.getElementById('postModal');
      const modal = new bootstrap.Modal(modalEl);
      modal.show();
    });

    li.append(a, btn);
    postsContainer.appendChild(li);
  });
};

// ---------- обработка формы ----------
form.addEventListener('submit', async (e) => {
  e.preventDefault();
  const url = input.value.trim();

  input.classList.remove('is-invalid');
  feedback.textContent = '';

  if (!url) {
    input.classList.add('is-invalid');
    feedback.textContent = i18next.t('errors.required');
    return;
  }

  const schema = yup.object({ url: yup.string().url().required() });

  try {
    await schema.validate({ url });

    if (state.feeds.find((f) => f.url === url)) {
      input.classList.add('is-invalid');
      feedback.textContent = i18next.t('errors.duplicate');
      return;
    }

    const response = await axios.get(buildProxyUrl(url));
    const data = parseRss(response.data.contents);

    state.feeds.push({ url, title: data.feedTitle, description: data.feedDescription });
    state.posts.unshift(...data.posts);

    renderFeeds();
    renderPosts();

    input.value = '';
    feedback.textContent = i18next.t('messages.success');
  } catch (err) {
    input.classList.add('is-invalid');
    if (err.key) feedback.textContent = i18next.t(err.key);
    else if (err.message === 'parse') feedback.textContent = i18next.t('errors.parse');
    else if (err.isAxiosError) feedback.textContent = i18next.t('errors.network');
    else feedback.textContent = i18next.t('errors.network');
  }
});
