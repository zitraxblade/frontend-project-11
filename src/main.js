import i18next from 'i18next';
import * as yup from 'yup';
import axios from 'axios';
import './style.css';

// Интернационализация
i18next.init({
  lng: 'ru',
  resources: {
    ru: {
      translation: {
        form: { placeholder: 'Введите URL RSS', submit: 'Добавить' },
        errors: {
          invalidUrl: 'Ссылка должна быть валидным URL',
          required: 'Не должно быть пустым',
          duplicate: 'RSS уже существует',
          loadError: 'Ошибка сети',
          parseError: 'Ресурс не содержит валидный RSS',
        },
        success: { feedAdded: 'RSS успешно загружен' },
        post: { view: 'Просмотр' },
      },
    },
  },
});

// yup
yup.setLocale({
  string: { url: () => ({ key: 'errors.invalidUrl' }) },
  mixed: { required: () => ({ key: 'errors.required' }) },
});

const state = {
  feeds: [],
  posts: [],
  readPosts: new Set(),
};

const schema = yup.object({ url: yup.string().url().required() });

const form = document.getElementById('rss-form');
const input = form.querySelector('input[name="url"]');
const feedbackContainer = document.getElementById('feedback-container');
const feedsContainer = document.getElementById('feeds-container');
const postsContainer = document.getElementById('posts-container');

input.placeholder = i18next.t('form.placeholder');
form.querySelector('button').textContent = i18next.t('form.submit');

const showMessage = (text, type = 'success') => {
  feedbackContainer.innerHTML = `<div class="alert alert-${type}" role="alert">${text}</div>`;
};

const buildProxyUrl = (url) =>
  `https://allorigins.hexlet.app/get?disableCache=true&url=${encodeURIComponent(url)}`;

const parseRss = (xml) => {
  const parser = new DOMParser();
  const doc = parser.parseFromString(xml, 'application/xml');

  const feedTitle = doc.querySelector('channel > title')?.textContent;
  const feedDescription = doc.querySelector('channel > description')?.textContent;

  const items = Array.from(doc.querySelectorAll('item')).map((item) => ({
    title: item.querySelector('title')?.textContent,
    link: item.querySelector('link')?.textContent,
    description: item.querySelector('description')?.textContent,
  }));

  if (!feedTitle || items.length === 0) throw new Error('parseError');
  return { feedTitle, feedDescription, posts: items };
};

// Рендер
const renderFeeds = () => {
  feedsContainer.innerHTML = '';
  state.feeds.forEach((feed) => {
    const div = document.createElement('div');
    div.classList.add('mb-3');
    div.innerHTML = `<h3>${feed.feedTitle}</h3><p>${feed.feedDescription}</p>`;
    feedsContainer.appendChild(div);
  });
};

const renderPosts = () => {
  postsContainer.innerHTML = '';
  state.posts.forEach((post, i) => {
    const li = document.createElement('li');
    li.className = 'list-group-item d-flex justify-content-between align-items-center';
    li.innerHTML = `
      <a href="${post.link}" target="_blank" class="${state.readPosts.has(i) ? 'fw-normal' : 'fw-bold'}">${post.title}</a>
      <button type="button" class="btn btn-primary btn-sm" data-index="${i}">${i18next.t('post.view')}</button>
    `;
    postsContainer.appendChild(li);
  });
};

// Модальное окно
const modal = new bootstrap.Modal(document.getElementById('postModal'));
const modalTitle = document.getElementById('modalTitle');
const modalBody = document.getElementById('modalBody');

postsContainer.addEventListener('click', (e) => {
  if (e.target.tagName === 'BUTTON') {
    const index = Number(e.target.dataset.index);
    const post = state.posts[index];
    state.readPosts.add(index);
    modalTitle.textContent = post.title;
    modalBody.textContent = post.description;
    modal.show();
    renderPosts();
  }
});

// Добавление фида
const addFeed = (url) => {
  return axios.get(buildProxyUrl(url))
    .then((res) => {
      const data = parseRss(res.data.contents);
      state.feeds.push({ url, feedTitle: data.feedTitle, feedDescription: data.feedDescription });
      state.posts = [...data.posts, ...state.posts];
      renderFeeds();
      renderPosts();
      showMessage(i18next.t('success.feedAdded'));
    });
};

// Обработчик формы
form.addEventListener('submit', (e) => {
  e.preventDefault();
  const url = input.value.trim();
  input.classList.remove('is-invalid');

  schema.validate({ url })
    .then(() => {
      if (state.feeds.some((f) => f.url === url)) {
        input.classList.add('is-invalid');
        showMessage(i18next.t('errors.duplicate'), 'danger');
        return Promise.reject();
      }
      return addFeed(url);
    })
    .then(() => {
      input.value = '';
      input.focus();
    })
    .catch((err) => {
      if (err?.key) showMessage(i18next.t(err.key), 'danger');
      else if (err?.message === 'parseError') showMessage(i18next.t('errors.parseError'), 'danger');
      else if (err) showMessage(i18next.t('errors.loadError'), 'danger');
      input.classList.add('is-invalid');
    });
});

// Автообновление
const updateFeeds = () => {
  const promises = state.feeds.map((feed) =>
    axios.get(buildProxyUrl(feed.url))
      .then((res) => {
        const { posts } = parseRss(res.data.contents);
        const newPosts = posts.filter((p) => !state.posts.some((sp) => sp.link === p.link));
        if (newPosts.length > 0) {
          state.posts = [...newPosts, ...state.posts];
          renderPosts();
        }
      })
      .catch(() => {})
  );

  Promise.all(promises).finally(() => setTimeout(updateFeeds, 5000));
};

updateFeeds();
