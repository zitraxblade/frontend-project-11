import axios from 'axios';

document.addEventListener('DOMContentLoaded', () => {
  const form = document.getElementById('rss-form');
  const input = form.querySelector('input[name="url"]');
  const feedsContainer = document.getElementById('feeds-container');
  const postsContainer = document.getElementById('posts-container');

  const buildProxyUrl = (url) =>
    `https://allorigins.hexlet.app/get?disableCache=true&url=${encodeURIComponent(url)}`;

  const parseRss = (xmlString) => {
    const parser = new DOMParser();
    const doc = parser.parseFromString(xmlString, 'application/xml');

    const feedTitle = doc.querySelector('channel > title')?.textContent || 'Без названия';
    const feedDescription = doc.querySelector('channel > description')?.textContent || 'Без описания';

    const items = Array.from(doc.querySelectorAll('item')).map(item => ({
      title: item.querySelector('title')?.textContent || 'Без заголовка',
      link: item.querySelector('link')?.textContent || '#',
      description: item.querySelector('description')?.textContent || 'Нет описания',
      read: false,
    }));

    if (!feedTitle || items.length === 0) throw new Error('parseError');

    return { feedTitle, feedDescription, posts: items };
  };

  const feeds = [];

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
      li.classList.add('d-flex', 'justify-content-between', 'align-items-start', 'mb-2');

      const a = document.createElement('a');
      a.href = post.link;
      a.textContent = post.title;
      a.target = '_blank';
      a.classList.add(post.read ? 'fw-normal' : 'fw-bold');

      const button = document.createElement('button');
      button.type = 'button';
      button.textContent = 'Просмотр';
      button.classList.add('btn', 'btn-sm', 'btn-outline-primary', 'ms-2');

      button.addEventListener('click', () => {
        post.read = true;
        a.classList.remove('fw-bold');
        a.classList.add('fw-normal');

        const modalTitle = document.getElementById('modalTitle');
        const modalBody = document.getElementById('modalBody');
        modalTitle.textContent = post.title;
        modalBody.textContent = post.description;

        const modalEl = document.getElementById('postModal');
        const bsModal = new bootstrap.Modal(modalEl);
        bsModal.show();
      });

      li.appendChild(a);
      li.appendChild(button);
      ul.appendChild(li);
    });

    postsContainer.appendChild(ul);
  };

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
      .catch(() => console.error('Ошибка сети'));
  };

  const startUpdatingFeeds = () => {
    const checkFeeds = () => {
      const promises = feeds.map(feed => updateFeed(feed));
      Promise.all(promises).finally(() => setTimeout(checkFeeds, 5000));
    };
    checkFeeds();
  };

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const url = input.value.trim();

    if (!url) {
      alert('Не должно быть пустым');
      return;
    }

    if (feeds.some(f => f.url === url)) {
      alert('RSS уже существует');
      return;
    }

    axios.get(buildProxyUrl(url))
      .then(response => {
        const data = parseRss(response.data.contents);
        const feedObj = { url, title: data.feedTitle, description: data.feedDescription, posts: data.posts };
        feeds.push(feedObj);

        renderFeed(data.feedTitle, data.feedDescription);
        renderPosts(data.posts);

        input.value = '';
        input.focus();

        startUpdatingFeeds();
        console.log('RSS успешно загружен');
      })
      .catch(() => alert('Ресурс не содержит валидный RSS или ошибка сети'));
  });
});

