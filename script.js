// API configuration
const API_KEY = 'd0ae3a6558740d2b980a7db223676e16';
const API_URL = 'http://api.mediastack.com/v1/news';

// Global variables
let currentPage = 1;
let totalPages = 1;
let currentCategory = '';
let currentLanguage = 'en';

const newsContainer = document.getElementById('news-container');
const searchForm = document.getElementById('search-form');
const searchInput = document.getElementById('search-input');
const searchButton = document.getElementById('search-button');
const categorySelect = document.getElementById('category-select');
const languageSelect = document.getElementById('language-select');
const loading = document.getElementById('loading');
const prevButton = document.getElementById('prev-button');
const nextButton = document.getElementById('next-button');
const pageInfo = document.getElementById('page-info');
const modal = document.getElementById('modal');
const closeBtn = document.getElementsByClassName('close')[0];
const likeButton = document.getElementById('like-button');
const shareButton = document.getElementById('share-button');
const commentForm = document.getElementById('comment-form');
const commentInput = document.getElementById('comment-input');
const commentsList = document.getElementById('comments-list');
const contactForm = document.getElementById('contact-form');

// Event listeners
searchButton.addEventListener('click', (e) => {
    e.preventDefault();
    currentPage = 1;
    fetchNews();
});

categorySelect.addEventListener('change', () => {
    currentCategory = categorySelect.value;
    currentPage = 1;
    fetchNews();
});

languageSelect.addEventListener('change', () => {
    currentLanguage = languageSelect.value;
    currentPage = 1;
    fetchNews();
});

prevButton.addEventListener('click', () => {
    if (currentPage > 1) {
        currentPage--;
        fetchNews();
    }
});

nextButton.addEventListener('click', () => {
    if (currentPage < totalPages) {
        currentPage++;
        fetchNews();
    }
});

closeBtn.onclick = function() {
    modal.style.display = "none";
}

window.onclick = function(event) {
    if (event.target == modal) {
        modal.style.display = "none";
    }
}

likeButton.addEventListener('click', () => {
    if (currentArticle) {
        const likedArticles = JSON.parse(localStorage.getItem('likedArticles') || '{}');
        if (likedArticles[currentArticle.title]) {
            delete likedArticles[currentArticle.title];
            likeButton.classList.remove('liked');
        } else {
            likedArticles[currentArticle.title] = true;
            likeButton.classList.add('liked');
        }
        localStorage.setItem('likedArticles', JSON.stringify(likedArticles));
    }
});

shareButton.addEventListener('click', () => {
    if (currentArticle) {
        const shareText = `Check out this article: ${currentArticle.title} - ${currentArticle.url}`;
        if (navigator.share) {
            navigator.share({
                title: currentArticle.title,
                text: shareText,
                url: currentArticle.url,
            }).then(() => {
                console.log('Successful share');
            }).catch((error) => {
                console.log('Error sharing:', error);
                fallbackShare();
            });
        } else {
            fallbackShare();
        }
    }
});

function fallbackShare() {
    const shareText = `Check out this article: ${currentArticle.title} - ${currentArticle.url}`;
    const tempInput = document.createElement('input');
    document.body.appendChild(tempInput);
    tempInput.value = shareText;
    tempInput.select();
    document.execCommand('copy');
    document.body.removeChild(tempInput);
    alert('Link copied to clipboard!');
}

commentForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const commentText = commentInput.value.trim();
    if (commentText && currentArticle) {
        addComment(commentText);
        commentInput.value = '';
    }
});

contactForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const name = document.getElementById('name').value;
    const email = document.getElementById('email').value;
    const message = document.getElementById('message').value;
    
    // Store the message in local storage
    const messages = JSON.parse(localStorage.getItem('contactMessages') || '[]');
    messages.push({ name, email, message, date: new Date().toISOString() });
    localStorage.setItem('contactMessages', JSON.stringify(messages));

    alert('Thank you for your message! We will get back to you soon.');
    contactForm.reset();
});

async function fetchNews() {
    loading.style.display = 'block';
    newsContainer.innerHTML = '';
    const searchTerm = searchInput.value;
    
    try {
        const url = new URL(API_URL);
        url.searchParams.append('access_key', API_KEY);
        url.searchParams.append('keywords', searchTerm);
        url.searchParams.append('categories', currentCategory);
        url.searchParams.append('languages', currentLanguage);
        url.searchParams.append('offset', (currentPage - 1) * 20);
        url.searchParams.append('limit', 20);

        const response = await fetch(url);
        const data = await response.json();
        
        if (data.error) {
            throw new Error(data.error.message);
        }

        totalPages = Math.ceil(data.pagination.total / data.pagination.limit);
        displayNews(data.data);
        updatePaginationInfo();
    } catch (error) {
        newsContainer.innerHTML = `<p>Error: ${error.message}</p>`;
    } finally {
        loading.style.display = 'none';
    }
}

function displayNews(articles) {
    articles.forEach((article, index) => {
        const articleElement = createArticleElement(article, index);
        newsContainer.appendChild(articleElement);
    });
}

function createArticleElement(article, index) {
    const articleElement = document.createElement('div');
    articleElement.classList.add('article-card', 'fade-in');
    articleElement.style.animationDelay = `${index * 0.1}s`;

    articleElement.innerHTML = `
        <img src="${article.image || '/api/placeholder/400/200'}" alt="${article.title}" class="article-image">
        <div class="article-content">
            <h2 class="article-title">${article.title}</h2>
            <p class="article-description">${article.description || 'No description available'}</p>
            <div class="article-meta">
                <span>${article.source}</span>
                <span>${new Date(article.published_at).toLocaleDateString()}</span>
            </div>
        </div>
    `;

    articleElement.addEventListener('click', () => openModal(article));
    return articleElement;
}

function updatePaginationInfo() {
    prevButton.disabled = currentPage === 1;
    nextButton.disabled = currentPage === totalPages;
    pageInfo.textContent = `Page ${currentPage} of ${totalPages}`;
}

function openModal(article) {
    currentArticle = article;
    document.getElementById('modal-title').textContent = article.title;
    document.getElementById('modal-date').textContent = new Date(article.published_at).toLocaleString();
    document.getElementById('modal-description').textContent = article.description || 'No description available';
    document.getElementById('modal-content').innerHTML = article.content || 'No content available';
    document.getElementById('modal-source').textContent = `Source: ${article.source}`;
    
    // Check if the article is liked
    const likedArticles = JSON.parse(localStorage.getItem('likedArticles') || '{}');
    if (likedArticles[article.title]) {
        likeButton.classList.add('liked');
    } else {
        likeButton.classList.remove('liked');
    }
    
    loadComments();
    
    modal.style.display = "block";
}

function addComment(text) {
    if (currentArticle) {
        const comments = JSON.parse(localStorage.getItem(`comments_${currentArticle.title}`) || '[]');
        comments.push({ text, date: new Date().toISOString() });
        localStorage.setItem(`comments_${currentArticle.title}`, JSON.stringify(comments));
        loadComments();
    }
}

function loadComments() {
    commentsList.innerHTML = '';
    if (currentArticle) {
        const comments = JSON.parse(localStorage.getItem(`comments_${currentArticle.title}`) || '[]');
        comments.forEach(comment => {
            const li = document.createElement('li');
            li.textContent = `${comment.text} - ${new Date(comment.date).toLocaleString()}`;
            commentsList.appendChild(li);
        });
    }
}

// Add smooth scrolling for navigation links
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
        e.preventDefault();
        document.querySelector(this.getAttribute('href')).scrollIntoView({
            behavior: 'smooth'
        });
    });
});

// Animate elements on scroll
function animateOnScroll() {
    const elements = document.querySelectorAll('.fade-in, .slide-in-left');
    elements.forEach(element => {
        const elementTop = element.getBoundingClientRect().top;
        const elementBottom = element.getBoundingClientRect().bottom;
        if (elementTop < window.innerHeight && elementBottom > 0) {
            element.classList.add('show');
        }
    });
}

window.addEventListener('scroll', animateOnScroll);
animateOnScroll(); // Initial check on page load

// Initial news fetch
fetchNews();