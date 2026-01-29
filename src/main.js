import i18next from 'i18next';
import * as yup from 'yup';
import axios from 'axios';
import './style.css';

document.addEventListener('DOMContentLoaded', () => {
  // ---------- i18next ----------
  i18next.init({
    lng: 'ru',
    resources: {
      ru: {
        translation: {
          form: { placeholder: 'Введите URL RSS', submit: 'Добавить' },
          errors: {
            invalidUrl: 'Некорректный URL',
            required: 'Введите URL',
            duplicate: 'URL уже добавлен',
            loadError: 'Ошибка загрузки RSS',
            parseError: 'Некорректный RSS-фид',
          },
        },
      },
    },
  });

  // ---------- yup + i18next ----------
  yup.setLocale({
    string: { url: () => ({ key: 'errors.invalidUrl' }) },
    mixed: { required: () => ({ key: 'errors.required' }) },
  });

  // ---------- прокси ----------
  const buildProxyUrl = (url) =>
    `https://allorigins.hexlet.app/get?disableCache=true&url=${encodeURIComponent(url)}`;

  // ---------- парсер RSS ----------
  const parseRss = (xmlString) => {
    const parser = new DOMParser();
    const doc = parser.parseFromString(xmlString, 'application/xml');
    const feedTitle = doc.querySelector('channel > title')?.textContent || 'Без названия';
    const feedDescription = doc.querySelector('channel > description')?.textContent || 'Без описания';
    const items = Array.from(doc.querySelectorAll('item')).map(item => ({
      title: item.querySelector('title')?.textContent || 'Без заголовка',
      link: item.querySelector('link')?.textContent || '#',
    }));
    if (!feedTitle || items.length === 0) throw new Error('parseError');
    return { feedTitle, feedDescription, posts: items };
  };

  // ---------- состояние ----------
  const feeds = [];
  const schema = yup.object({ url: yup.string().url().required() });

  // ---------- DOM ----------
  const form = document.getElementById('rss-form');
  const input = form.querySelector('input[name="url"]');
  const feedsContainer = document.getElementById('feeds-container');
  const postsContainer = document.getElementById('posts-container');

  input.placeholder = i18next.t('form.placeholder');
  form.querySelector('button').textContent = i18next.t('form.submit');

  // ---------- рендер ----------
  const renderFeed = (title, description) => {
    const div = document.createElement('div');
    div.classList.add('mt-4');
    div.innerHTML = `<h3>${title}</h3><p>${description}</p>`;
    feedsContainer.appendChild(div);
  };

  const renderPosts = (posts) => {
    const ul = document.createElement('ul');
    ul.classList.add('mt-3');
    posts.forEach(post => {
      const li = document.createElement('li');
      const a = document.createElement('a');
      a.href = post.link;
      a.textContent = post.title;
      a.target = '_blank';
      li.appendChild(a);
      ul.appendChild(li);
    });
    postsContainer.appendChild(ul);
  };

  // ---------- обработчик формы ----------
  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const url = input.value.trim();
    input.classList.remove('is-invalid');

    schema.validate({ url })
      .then(() => {
        if (feeds.includes(url)) return Promise.reject({ key: 'errors.duplicate' });

        return axios.get(buildProxyUrl(url));
      })
      .then((response) => {
        const xml = response.data.contents;
        const data = parseRss(xml);

        feeds.push(url);
        renderFeed(data.feedTitle, data.feedDescription);
        renderPosts(data.posts);

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

  // ---------- добавим сразу русский RSS для теста ----------
  form.querySelector('input').value = 'https://lorem-rss.hexlet.app/feed?locale=ru';
  form.dispatchEvent(new Event('submit'));
});

