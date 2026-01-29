/* global bootstrap */
import i18next from 'i18next'
import axios from 'axios'
import * as yup from 'yup'
import './style.css'

const form = document.querySelector('#rss-form')
const input = form.querySelector('input[name="url"]')
const feedback = document.querySelector('#feedback')
const feedsContainer = document.querySelector('#feeds-container')
const postsContainer = document.querySelector('#posts-container')

i18next.init({
  lng: 'ru',
  resources: {
    ru: {
      translation: {
        messages: {
          success: 'RSS успешно загружен',
          duplicate: 'RSS уже существует',
          empty: 'Не должно быть пустым',
          invalidUrl: 'Ссылка должна быть валидным URL',
          noRss: 'Ресурс не содержит валидный RSS',
          network: 'Ошибка сети'
        }
      }
    }
  }
})

const state = {
  feeds: [],
  posts: [],
  readPosts: new Set()
}

const schema = yup.string().url()

const showFeedback = (message, type = 'error') => {
  feedback.textContent = message
  feedback.classList.remove('valid-feedback', 'invalid-feedback')
  feedback.classList.add(type === 'success' ? 'valid-feedback' : 'invalid-feedback')
}

const renderFeeds = () => {
  feedsContainer.innerHTML = ''
  state.feeds.forEach(feed => {
    const div = document.createElement('div')
    div.classList.add('card', 'mb-3', 'p-3')
    div.innerHTML = `<h5>${feed.title}</h5><p>${feed.description}</p>`
    feedsContainer.appendChild(div)
  })
}

const renderPosts = () => {
  postsContainer.innerHTML = ''
  state.posts.forEach(post => {
    const div = document.createElement('div')
    div.classList.add('mb-2')
    const readClass = state.readPosts.has(post.link) ? 'fw-normal' : 'fw-bold'
    div.innerHTML = `
      <a href="${post.link}" target="_blank" class="${readClass}">${post.title}</a>
      <button type="button" class="btn btn-sm btn-outline-primary ms-2">Просмотр</button>
    `
    const btn = div.querySelector('button')
    btn.addEventListener('click', () => openModal(post))
    postsContainer.appendChild(div)
  })
}

const openModal = post => {
  state.readPosts.add(post.link)
  renderPosts()

  const modalTitle = document.querySelector('#modalTitle')
  const modalBody = document.querySelector('#modalBody')

  modalTitle.textContent = post.title
  modalBody.textContent = post.description

  const modal = new bootstrap.Modal(document.querySelector('#postModal'))
  modal.show()
}

const fetchRss = async url => {
  const response = await axios.get(
    `https://allorigins.hexlet.app/get?disableCache=true&url=${encodeURIComponent(url)}`
  )

  const parser = new DOMParser()
  const doc = parser.parseFromString(response.data.contents, 'application/xml')

  const title = doc.querySelector('channel > title')?.textContent
  const description = doc.querySelector('channel > description')?.textContent

  if (!title) {
    throw new Error('no rss')
  }

  const items = Array.from(doc.querySelectorAll('item')).map(item => ({
    title: item.querySelector('title')?.textContent || '',
    description: item.querySelector('description')?.textContent || '',
    link: item.querySelector('link')?.textContent || ''
  }))

  return { title, description, items }
}

form.addEventListener('submit', async e => {
  e.preventDefault()
  const url = input.value.trim()

  try {
    await schema.validate(url)

    if (state.feeds.some(f => f.url === url)) {
      showFeedback(i18next.t('messages.duplicate'), 'error')
      return
    }

    const { title, description, items } = await fetchRss(url)

    state.feeds.push({
      url,
      title,
      description
    })

    state.posts.push(...items)
    renderFeeds()
    renderPosts()
    showFeedback(i18next.t('messages.success'), 'success')
    input.value = ''
  } catch (err) {
    if (err.name === 'ValidationError') {
      showFeedback(i18next.t('messages.invalidUrl'), 'error')
    } else if (err.message === 'no rss') {
      showFeedback(i18next.t('messages.noRss'), 'error')
    } else {
      showFeedback(i18next.t('messages.network'), 'error')
    }
  }
})
