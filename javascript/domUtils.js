/**
 * DOM manipulation utilities
 */
const $ = (selector) => document.querySelector(selector);
const $$ = (selector) => document.querySelectorAll(selector);

const createElement = (tag, attributes = {}, content = '') => {
  const element = document.createElement(tag);
  Object.assign(element, attributes);
  if (content) element.innerHTML = content;
  return element;
};

const addEventListeners = (element, events) => {
  Object.entries(events).forEach(([event, handler]) => {
    element.addEventListener(event, handler);
  });
  return element;
};

const toggleVisibility = (element, show, display = 'block') => {
  element.style.display = show ? display : 'none';
  return element;
};

const toggleClass = (element, className, force) => {
  element.classList.toggle(className, force);
  return element;
};

const getElementRect = (element) => {
  const rect = element.getBoundingClientRect();
  return {
    width: rect.width,
    height: rect.height,
    top: rect.top + window.scrollY,
    left: rect.left + window.scrollX
  };
};

const scrollIntoView = (element, behavior = 'smooth') => {
  element?.scrollIntoView({ behavior });
};

module.exports = {
  $, $$, createElement, addEventListeners, toggleVisibility, 
  toggleClass, getElementRect, scrollIntoView
};