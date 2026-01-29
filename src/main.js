import i18next from 'i18next';
import * as yup from 'yup';
import axios from 'axios';
import './style.css';

// i18next
i18next.init({
  lng: 'ru',
  resources: {
    ru: {
      translation: {
        form: { placeholder: 'Введите URL RSS', submit: 'Добавить' },
        messages: { success: 'RSS успешно загружен' },
        errors: {
          invalidUrl: 'Ссылка должна быть валидным URL',
          required: 'Не должно быть пустым',
          duplicate: 'RSS уже существует',
          loadError: 'Ошибка сети',
          parseError: 'Ресурс не содержит валидный RSS',
        },
        buttons: { preview: 'Просмотр' },
      },
    },
  },
});

// yup + i18next
yup.setLocale({
  string: { url: () => ({ key: 'errors.invalidUrl' }) },
  mixed: { required: () => ({ key: 'errors.required' }) },
});

// прокси
const buildProxyUrl = (url) =>
  `https://allorigins.hexlet.app/get?disableCache=true&url=${encodeURIComponent(url)}`;

// парсер
const parseRss = (xmlString) => {
  const parser = new DOMParser();
  const doc = parser.parseFromString(xmlString, 'application/xml');

  const feedTitle = doc.querySelector('channel > title')?.textContent;
  const feedDescription = doc.querySelector('channel > description')?.textContent;

  const items = doc.querySelectorAll('item');
  const posts = Array.from(items).map((item) => ({
    title: item.querySelector('title')?.textContent,
    link: item.querySelector('link')?.textContent,
    description: item.querySelector('description')?.textContent,
    id: item.querySelector('guid')?.textContent || Math.random().toString(),
  }));

  if (!feedTitle || posts.length === 0) throw new Error('parseError');

  return { feedTitle, feedDescription, posts };
};

// состояние
const state = { feeds: [], posts: [], readPosts: new Set() };

// DOM
const form = document.getElementById('rss-form');
const input = form.querySelector('input[name="url"]');
const feedback = document.getElementById('feedback');
const feedsContainer = document.getElementById('feeds-container');
const postsContainer = document.getElementById('posts-container');

// тексты формы
input.placeholder = i18next.t('form.placeholder');
form.querySelector('button').textContent = i18next.t('form.submit');

// рендер
const renderFeed = ({ feedTitle, feedDescription }) => {
  const div = document.createElement('div');
  div.classList.add('card', 'p-3', 'mb-3');
  div.innerHTML = `<h3>${feedTitle}</h3><p>${feedDescription}</p>`;
  feedsContainer.appendChild(div);
};

const renderPosts = (posts) => {
  const ul = document.createElement('ul');
  ul.classList.add('list-group');

  posts.forEach((post) => {
    const li = document.createElement('li');
    li.classList.add('list-group-item', 'd-flex', 'justify-content-between', 'align-items-start');

    const a = document.createElement('a');
    a.href = post.link;
    a.textContent = post.title;
    a.target = '_blank';
    a.classList.add(state.readPosts.has(post.id) ? 'fw-normal' : 'fw-bold');

    const btn = document.createElement('button');
    btn.type = 'button';
    btn.textContent = i18next.t('buttons.preview');
    btn.classList.add('btn', 'btn-outline-primary', 'btn-sm');
    btn.addEventListener('click', () => {
      const modal = new bootstrap.Modal(document.getElementById('postModal'));
      document.getElementById('modalTitle').textContent = post.title;
      document.getElementById('modalBody').textContent = post.description;
      modal.show();

      state.readPosts.add(post.id);
      a.classList.replace('fw-bold', 'fw-normal');
    });

    li.appendChild(a);
    li.appendChild(btn);
    ul.appendChild(li);
  });

  postsContainer.prepend(ul);
};

// обновление постов
const updateFeeds = () => {
  state.feeds.forEach((url) => {
    axios.get(buildProxyUrl(url))
      .then((res) => {
        const { posts } = parseRss(res.data.contents);
        const newPosts = posts.filter((p) => !state.posts.some((sp) => sp.id === p.id));
        if (newPosts.length > 0) {
          state.posts.push(...newPosts);
          renderPosts(newPosts);
        }
      })
      .catch(() => { /* сетевые ошибки игнорируем для обновления */ })
      .finally(() => setTimeout(updateFeeds, 5000));
  });
};

// обработчик формы
form.addEventListener('submit', (e) => {
  e.preventDefault();
  const url = input.value.trim();

  input.classList.remove('is-invalid');
  feedback.textContent = '';

  const schema = yup.object({ url: yup.string().url().required() });

  schema.validate({ url })
    .then(() => {
      if (state.feeds.includes(url)) {
        input.classList.add('is-invalid');
        feedback.textContent = i18next.t('errors.duplicate');
        return Promise.reject();
      }
      return axios.get(buildProxyUrl(url));
    })
    .then((res) => {
      let data;
      try {
        data = parseRss(res.data.contents);
      } catch {
        input.classList.add('is-invalid');
        feedback.textContent = i18next.t('errors.parseError');
        return Promise.reject();
      }

      state.feeds.push(url);
      state.posts.push(...data.posts);
      renderFeed(data);
      renderPosts(data.posts);

      input.value = '';
      input.focus();
      feedback.textContent = i18next.t('messages.success');

      if (!window.updateFeedsStarted) {
        window.updateFeedsStarted = true;
        updateFeeds();
      }
    })
    .catch((err) => {
      if (err.key) {
        input.classList.add('is-invalid');
        feedback.textContent = i18next.t(err.key);
      } else if (!feedback.textContent) {
        input.classList.add('is-invalid');
        feedback.textContent = i18next.t('errors.loadError');
      }
    });
});

