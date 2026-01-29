import i18next from 'i18next';
import * as yup from 'yup';
import axios from 'axios';
import './style.css';

document.addEventListener('DOMContentLoaded', () => {
  // i18next для интерфейса
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

  // yup для валидации
  yup.setLocale({
    string: { url: () => ({ key: 'errors.invalidUrl' }) },
    mixed: { required: () => ({ key: 'errors.required' }) },
  });

  // прокси для обхода CORS
  const buildProxyUrl = (url) =>
    `https://allorigins.hexlet.app/get?disableCache=true&url=${encodeURIComponent(url)}`;

  // парсер RSS
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

  // состояние
  const feeds = [];
  const schema = yup.object({ url: yup.string().url().required() });

  // DOM
  const form = document.getElementById('rss-form');
  const input = form.querySelector('input[name="url"]');
  const feedsContainer = document.getElementById('feeds-container');
  const postsContainer = document.getElementById('posts-container');

  input.placeholder = i18next.t('form.placeholder');
  form.querySelector('button').textContent = i18next.t('form.submit');

  // рендер фида
  const renderFeed = (title, description) => {
    const div = document.createElement('div');
    div.classList.add('mt-4');
    div.innerHTML = `<h3>${title}</h3><p>${description}</p>`;
    feedsContainer.appendChild(div);
  };

  // рендер постов
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

  // обновление одного фида
  const updateFeed = (feed) => {
    return axios.get(buildProxyUrl(feed.url))
      .then(response => {
        const data = parseRss(response.data.contents);
        const newPosts = data.posts.filter(post => !feed.posts.some(p => p.link === post.link));
        if (newPosts.length > 0) {
          feed.posts.push(...newPosts);
          renderPosts(newPosts);
        }
      })
      .catch(err => console.error(`Ошибка обновления фида ${feed.url}:`, err));
  };

  // рекурсивная проверка всех фидов каждые 5 секунд
  const startUpdatingFeeds = () => {
    const checkFeeds = () => {
      const promises = feeds.map(feed => updateFeed(feed));
      Promise.all(promises)
        .finally(() => setTimeout(checkFeeds, 5000));
    };
    checkFeeds();
  };

  // обработчик формы
  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const url = input.value.trim();
    input.classList.remove('is-invalid');

    schema.validate({ url })
      .then(() => {
        if (feeds.some(f => f.url === url)) return Promise.reject({ key: 'errors.duplicate' });
        return axios.get(buildProxyUrl(url));
      })
      .then(response => {
        const data = parseRss(response.data.contents);
        const feedObj = { url, title: data.feedTitle, description: data.feedDescription, posts: data.posts };
        feeds.push(feedObj);

        renderFeed(data.feedTitle, data.feedDescription);
        renderPosts(data.posts);

        input.value = '';
        input.focus();

        startUpdatingFeeds();
      })
      .catch(err => {
        input.classList.add('is-invalid');
        if (err.key) console.log(i18next.t(err.key));
        else if (err.message === 'parseError') console.log(i18next.t('errors.parseError'));
        else console.log(i18next.t('errors.loadError'));
      });
  });

  // сразу добавляем русский тестовый фид
  input.value = 'https://lorem-rss.hexlet.app/feed?locale=ru';
  form.dispatchEvent(new Event('submit'));
});

