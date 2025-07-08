document.addEventListener('DOMContentLoaded', () => {
    
    const mobileMenuButton = document.getElementById('mobile-menu-button');
    const mobileMenu = document.getElementById('mobile-menu');
    mobileMenuButton.addEventListener('click', () => {
        mobileMenu.classList.toggle('hidden');
    });

   
    const navLinks = document.querySelectorAll('.nav-link, #mobile-menu a');
    const pages = document.querySelectorAll('.page');

    function showPage(hash) {
        pages.forEach(page => page.classList.remove('active'));
        document.querySelectorAll('.nav-link').forEach(link => link.classList.remove('active'));

        const activePage = document.querySelector(hash);
        const activeLink = document.querySelector(`.nav-link[href="${hash}"]`);

        if (activePage) activePage.classList.add('active');
        if (activeLink) activeLink.classList.add('active');

        if (!mobileMenu.classList.contains('hidden')) {
            mobileMenu.classList.add('hidden');
        }
    }

    navLinks.forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            const hash = e.currentTarget.getAttribute('href');
            window.location.hash = hash;
            showPage(hash);
        });
    });

    showPage(window.location.hash || '#home');

    
    const magicLamp = document.getElementById('magicLamp');
    const treasureChest = document.getElementById('treasureChest');
    const makeWishBtn = document.getElementById('makeWishBtn');
    const wishInput = document.getElementById('wishInput');
    const genieResponse = document.getElementById('genieResponse');
    const loadingModal = document.getElementById('loadingModal');
    const startRideBtn = document.getElementById('startRideBtn');
    const magicCarpet = document.getElementById('magicCarpet');
    const startGameBtn = document.getElementById('startGameBtn');

    const API_KEY = "AIzaSyDP0RIOhummWOWUYFHi4IFH5A0JemOggJg"; // Important: Leave empty
    const API_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${API_KEY}`;

    const toggleLoading = (isLoading) => loadingModal.classList.toggle('hidden', !isLoading);

    const generateContent = async (prompt, targetElement, loadingMessage) => {
        targetElement.innerHTML = `<div class="loader mx-auto"></div><p class="mt-2">${loadingMessage}</p>`;
        toggleLoading(true);
        try {
            const payload = { contents: [{ role: "user", parts: [{ text: prompt }] }], generationConfig: { temperature: 0.8, topP: 1.0 } };
            const response = await fetch(API_URL, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
            if (!response.ok) throw new Error(`API Error: ${response.statusText}`);
            const result = await response.json();
            const text = result.candidates?.[0]?.content?.parts?.[0]?.text;
            if (text) { targetElement.innerHTML = text; }
            else {
                targetElement.textContent = 'The magic fades... Could not get a response.';
                console.error('Unexpected API response:', result);
            }
        } catch (error) {
            console.error('API Error:', error);
            targetElement.textContent = 'A sandstorm is blocking the magic. Please try again.';
        } finally {
            toggleLoading(false);
        }
    };

    magicLamp.addEventListener('click', () => generateContent("Describe a wondrous and unique treasure found in the Cave of Wonders, beyond just gold and jewels.", treasureChest, "Searching..."));

    makeWishBtn.addEventListener('click', () => {
        const userWish = wishInput.value.trim();
        if (!userWish) { genieResponse.textContent = "You must first speak your wish!"; return; }
        const prompt = `You are a friendly, powerful, and slightly mischievous Genie. A user has wished for: "${userWish}". Respond with charm and wit in 2-3 sentences.`;
        generateContent(prompt, genieResponse, "Pondering your wish...");
    });

    startRideBtn.addEventListener('click', () => {
        magicCarpet.classList.add('no-transition');
        magicCarpet.classList.remove('fly');
        void magicCarpet.offsetWidth;
        magicCarpet.classList.remove('no-transition');
        magicCarpet.classList.add('fly');
    });

    
    const canvas = document.getElementById('gameCanvas');
    const ctx = canvas.getContext('2d');
    const scoreEl = document.getElementById('score');
    const livesEl = document.getElementById('lives');
    const gameMessage = document.getElementById('gameMessage');
    const gameContainer = document.getElementById('game-container');

    let score, lives, player, gems, gameInterval, gemSpawnerInterval, isGameRunning = false;
    let rightPressed = false;
    let leftPressed = false;
    const WINNING_SCORE = 20;
    const MAX_GEMS_ON_SCREEN = 3;

    const playerImage = new Image();
    playerImage.src = './abu5.png';
    const gemImage = new Image();
    gemImage.src = './Diamond.png';

   
    function repositionElements(oldWidth, oldHeight) {
        if (!isGameRunning) return;

       
        const playerXRatio = player.x / oldWidth;
        player.width = canvas.width * 0.15;
        player.height = player.width * 0.67;
        player.speed = canvas.width * 0.01;
        player.x = playerXRatio * canvas.width;
        player.y = canvas.height - player.height - 10; 
        
        gems.forEach(gem => {
            const gemXRatio = gem.x / oldWidth;
            const gemYRatio = gem.y / oldHeight;
            gem.width = canvas.width * 0.07;
            gem.height = gem.width;
            gem.speed = (canvas.height * 0.005) + Math.random() * 2;
            gem.x = gemXRatio * canvas.width;
            gem.y = gemYRatio * canvas.height;
        });
    }

    
    function resizeCanvas() {
        const oldWidth = canvas.width;
        const oldHeight = canvas.height;

        const containerWidth = gameContainer.clientWidth;
        if (containerWidth === 0) return; 
        canvas.width = containerWidth;
        canvas.height = (containerWidth / 4) * 3; 

       
        if (isGameRunning) {
            repositionElements(oldWidth, oldHeight);
        }
    }

    window.addEventListener('resize', resizeCanvas);

    function initGame() {
        isGameRunning = true;
        score = 0;
        lives = 3;
        scoreEl.textContent = score;
        livesEl.textContent = lives;

        const playerWidth = canvas.width * 0.15;
        const playerHeight = playerWidth * 0.67;

        player = {
            x: canvas.width / 2 - (playerWidth / 2),
            y: canvas.height - playerHeight - 10,
            width: playerWidth,
            height: playerHeight,
            speed: canvas.width * 0.01
        };
        gems = [];

        if (gameInterval) clearInterval(gameInterval);
        if (gemSpawnerInterval) clearInterval(gemSpawnerInterval);

        gameInterval = setInterval(gameLoop, 20);
        gemSpawnerInterval = setInterval(spawnNewGem, 1000);

        gameMessage.classList.add('hidden');
    }

    function spawnNewGem() {
        if (gems.length < MAX_GEMS_ON_SCREEN) {
            const gemSize = canvas.width * 0.07;
            gems.push({
                x: Math.random() * (canvas.width - gemSize),
                y: -gemSize,
                width: gemSize,
                height: gemSize,
                speed: (canvas.height * 0.005) + Math.random() * 2
            });
        }
    }

    function drawPlayer() { ctx.drawImage(playerImage, player.x, player.y, player.width, player.height); }
    function drawGems() { gems.forEach(gem => ctx.drawImage(gemImage, gem.x, gem.y, gem.width, gem.height)); }

    function updatePositions() {
        if (!isGameRunning) return;
        if (rightPressed && player.x < canvas.width - player.width) player.x += player.speed;
        if (leftPressed && player.x > 0) player.x -= player.speed;

        for (let i = gems.length - 1; i >= 0; i--) {
            const gem = gems[i];
            gem.y += gem.speed;

            if (gem.x < player.x + player.width && gem.x + gem.width > player.x &&
                gem.y < player.y + player.height && gem.y + gem.height > player.y) {
                score++;
                scoreEl.textContent = score;
                gems.splice(i, 1);

                if (score >= WINNING_SCORE) {
                    endGame("You Win!");
                }
                continue;
            }

            if (gem.y > canvas.height) {
                lives--;
                livesEl.textContent = lives;
                gems.splice(i, 1);

                if (lives <= 0) {
                    endGame("Game Over");
                }
            }
        }
    }

    function endGame(message) {
        isGameRunning = false;
        clearInterval(gameInterval);
        clearInterval(gemSpawnerInterval);
        gameMessage.textContent = message;
        gameMessage.classList.remove('hidden');
    }

    function gameLoop() {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        drawGems();
        drawPlayer();
        updatePositions();
    }

    startGameBtn.addEventListener('click', () => {
        startGameBtn.textContent = 'Restart Game';
        initGame();
        canvas.focus();
    });

    document.addEventListener('keydown', (e) => {
        if (e.key === "Right" || e.key === "ArrowRight") rightPressed = true;
        else if (e.key === "Left" || e.key === "ArrowLeft") leftPressed = true;
    });
    document.addEventListener('keyup', (e) => {
        if (e.key === "Right" || e.key === "ArrowRight") rightPressed = false;
        else if (e.key === "Left" || e.key === "ArrowLeft") leftPressed = false;
    });

    resizeCanvas();
});