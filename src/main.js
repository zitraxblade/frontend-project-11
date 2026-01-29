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
        form: {
          placeholder: 'Введите URL RSS',
          submit: 'Добавить',
        },
        errors: {
          invalidUrl: 'Ссылка должна быть валидным URL',
          required: 'Не должно быть пустым',
          duplicate: 'RSS уже существует',
          loadError: 'Ошибка сети',
          parseError: 'Ресурс не содержит валидный RSS',
        },
        success: {
          feedAdded: 'RSS успешно загружен',
        },
        posts: {
          preview: 'Просмотр',
        },
      },
    },
  },
});

// yup
yup.setLocale({
  string: {
    url: () => ({ key: 'errors.invalidUrl' }),
  },
  mixed: {
    required: () => ({ key: 'errors.required' }),
  },
});

// прокси All Origins
const buildProxyUrl = (url) =>
  `https://allorigins.hexlet.app/get?disableCache=true&url=${encodeURIComponent(url)}`;

// парсер RSS
const parseRss = (xmlString) => {
  const parser = new DOMParser();
  const doc = parser.parseFromString(xmlString, 'application/xml');

  const feedTitle = doc.querySelector('channel > title')?.textContent;
  const feedDescription = doc.querySelector('channel > description')?.textContent;

  const items = doc.querySelectorAll('item');
  const posts = Array.from(items).map((item) => ({
    id: crypto.randomUUID(),
    title: item.querySelector('title')?.textContent,
    link: item.querySelector('link')?.textContent,
    description: item.querySelector('description')?.textContent,
    read: false,
  }));

  if (!feedTitle || posts.length === 0) {
    throw new Error('parseError');
  }

  return { feedTitle, feedDescription, posts };
};

// состояние
const state = {
  feeds: [],
  posts: [],
};

// DOM
const form = document.getElementById('rss-form');
const input = form.querySelector('input[name="url"]');
input.placeholder = i18next.t('form.placeholder');
form.querySelector('button').textContent = i18next.t('form.submit');

const feedsContainer = document.getElementById('feeds-container');
const postsContainer = document.getElementById('posts-container');

const modalTitle = document.getElementById('modalTitle');
const modalBody = document.getElementById('modalBody');
const postModal = new bootstrap.Modal(document.getElementById('postModal'));

// рендер фидов
const renderFeed = (feed) => {
  const div = document.createElement('div');
  div.classList.add('mb-3');
  div.innerHTML = `<h3>${feed.feedTitle}</h3><p>${feed.feedDescription}</p>`;
  feedsContainer.appendChild(div);
};

// рендер постов
const renderPosts = () => {
  postsContainer.innerHTML = '';
  state.posts.forEach((post) => {
    const li = document.createElement('li');
    li.classList.add('mb-2');
    const a = document.createElement('a');
    a.href = post.link;
    a.textContent = post.title;
    a.target = '_blank';
    a.classList.add(post.read ? 'fw-normal' : 'fw-bold');

    const btn = document.createElement('button');
    btn.type = 'button';
    btn.classList.add('btn', 'btn-primary', 'btn-sm', 'ms-2');
    btn.textContent = i18next.t('posts.preview');

    btn.addEventListener('click', () => {
      post.read = true;
      renderPosts();
      modalTitle.textContent = post.title;
      modalBody.textContent = post.description;
      postModal.show();
    });

    li.append(a, btn);
    postsContainer.appendChild(li);
  });
};

// обработчик формы
form.addEventListener('submit', (e) => {
  e.preventDefault();
  const url = input.value.trim();
  input.classList.remove('is-invalid');

  yup.object({ url: yup.string().url().required() })
    .validate({ url })
    .then(() => {
      if (state.feeds.some((f) => f.url === url)) {
        throw { key: 'errors.duplicate' };
      }
      return axios.get(buildProxyUrl(url));
    })
    .then((res) => {
      const data = parseRss(res.data.contents);
      state.feeds.push({ url, feedTitle: data.feedTitle, feedDescription: data.feedDescription });
      state.posts = [...data.posts, ...state.posts];
      renderFeed(data);
      renderPosts();
      input.value = '';
      input.focus();
    })
    .catch((err) => {
      input.classList.add('is-invalid');
      if (err.key) console.log(i18next.t(err.key));
      else if (err.message === 'parseError') console.log(i18next.t('errors.parseError'));
      else console.log(i18next.t('errors.loadError'));
    });
});
