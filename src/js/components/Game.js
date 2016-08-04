import Circle from './Circle.js';
import Interface from './Interface.js';
import Bullets from './Bullets.js';

/**
 * @class Game class with main loop
 */
export default class Game {
	/**
	 * @constructor
	 */
	constructor() {
		this.interface = new Interface();
	}

	/**
	 * Запуск игрового процесса
	 *
	 * @private
	 */
	_initNewGame(level) {
		this.gameColors = ['#f44336', '#FF4081', '#9C27B0', '#3F51B5',
		'#42A5F5', '#18FFFF', '#76FF03', '#EEFF41', '#FFCA28', '#FF5722',
		'#424242', '#795548', '#CFD8DC'];
		this.level = this.levels[level];
		this._shuffleColors(this.gameColors, this.level.colorSlice.length);
		this.circle = new Circle(this.level, this.colors);
		this.bullets = new Bullets(this.level, this.colors);
		this._render();
		this._isPaused = false;
		this._lastTime = 0;
		this._fire = false;
		this.bullets.hit = false;
		this._changeUrl(`Level ${this.levelNumber}`, `#level/${this.levelNumber}`);
		this.interface.showGameScreen();
		this._updateStep = 25;
		this._gameLoopInterval = setInterval(this._gameLoop.bind(this), this._updateStep);
	}

	/**
	 * Выбрать случайные цвета из массива для уровня
	 *
	 * @param  {Array} colors used in the game
	 * @param  {number} number of circle slices for level
	 */
	_shuffleColors(gameColors, count) {
		this.colors = gameColors.slice(0);
		let i = gameColors.length;
		const min = i - count;
		while (i-- > min) {
			const index = Math.floor((i + 1) * Math.random());
			const temp = this.colors[index];
			this.colors[index] = this.colors[i];
			this.colors[i] = temp;
		}
		this.colors = this.colors.slice(min);
	}

	/**
	 * Прорисовка игровых компонентов
	 *
	 * @private
	 */
	_render() {
		this.circle.renderSlices();
		this.bullets.renderBullets();
	}

	/**
	 * Сброс данных уровня при выходе или конце игры
	 *
	 * @private
	 */
	_resetLevel() {
		clearInterval(this._gameLoopInterval);
		this.bullets.bulletPath = 0;
		if (this.bullets.activeBullet) {
			this.bullets.activeBullet.remove();
		}
		this.circle.el.innerHTML = '';
		this.bullets.el.innerHTML = '';
	}

	/**
	 * Проверка правильности попадания и продолжение игры с новой пулей или экран проигрыша
	 *
	 * @private
	 */
	_onHit() {
		if (this.circle.hitSectorColor === this.bullets.activeBullet.color) {
			this._fire = false;
			this.circle.deleteHitSector();
			this._levelPassed();
			this.bullets.reset();
		} else {
			this._resetLevel();
			this.interface.showLoseScreen();
			this._changeUrl(`Level ${this.levelNumber} | Lose`, `#level/${this.levelNumber}/lose`);
		}
	}

	/**
	 * Основной игровой цикл
	 *
	 * @private
	 */
	_gameLoop() {
		const time = Date.now();
		const delta = time - this._lastTime; // время с последнего обновления
		this._lastTime = time; // на следующий вызов сохраняется текущее время
		if (!this._isPaused) {
			this.circle.update(delta);// круг поворачивается исходя из прошедшего времени
			if (this._fire) { // произошло событие выстрела
				this.bullets.update(delta); // пуля летит
				if (this.bullets.hit) { // когда координаты пули поравнялись с кругом
					this._onHit(); // правильный сектор удаляется либо показывается экран конца игры
				}
			}
		}
	}

	/**
	 * Проверка, пройден ли уровень
	 *
	 * @private
	 */
	_levelPassed() {
		if (!this.circle.el.children.length) {
			this._changeUrl(`Level ${this.levelNumber} | Win`, `#level/${this.levelNumber}/win`);
			this._resetLevel();
			this.interface.showWinScreen();
		}
	}

	/**
	* Обработка клика для запуска пули
	*
	* @param	{event} bullet fire event
	* @returns {boolean}
	*/
	fire(event) {
		event.preventDefault();
		if (event.target.dataset.action !== 'pause') {
			this._fire = true;
		}
	}

	/**
	 * Смена состояния адресной строки
	 *
	 * @private
	 */
	_changeUrl(name, href) {
		history.replaceState({ level: this.levelNumber }, `Dulp | ${name}`, href);
	}

	/**
	 * Обработка событий клика по кнопкам меню
	 *
	 * @param	{Event} click event
	 */
	onClick(event) {
		event.preventDefault();

		switch (event.target.dataset.action) {
		case 'newgame':
			localStorage.removeItem('levelNumber');
			this.levelNumber = 1;
			this._initNewGame(this.levelNumber);
			break;
		case 'continue':
			this.levelNumber = localStorage.getItem('levelNumber');
			this._initNewGame(this.levelNumber);
			this._isPaused = false;
			this.interface.showGameScreen();
			break;
		case 'pause':
			this._isPaused = true;
			this._changeUrl(`Level ${this.levelNumber} | Paused`, `#level/${this.levelNumber}/paused`);
			this.interface.showPauseScreen();
			break;
		case 'continue-pause':
			this._isPaused = false;
			this._changeUrl(`Level ${this.levelNumber}`, `#level/${this.levelNumber}`);
			this.interface.showGameScreen();
			break;
		case 'exit-win':
			localStorage.setItem('levelNumber', this.levelNumber + 1);
			this._resetLevel();
			this.interface.showStartScreen();
			this.interface.isContinuable();
			break;
		case 'exit':
			this._resetLevel();
			this.interface.showStartScreen();
			this.interface.isContinuable();
			break;
		case 'nextlevel':
			this.levelNumber++;
			localStorage.setItem('levelNumber', this.levelNumber);
			this._initNewGame(this.levelNumber);
			this.interface.showGameScreen();
			break;
		case 'tryagain':
			this._initNewGame(this.levelNumber);
			this.interface.showGameScreen();
			break;
		default:
			break;
		}
	}

	checkLocation() {
		if ((location.hash.indexOf('#level/') === 0) && (history.state.level)) {
			this.levelNumber = history.state.level;
			this._initNewGame(this.levelNumber);
			this._isPaused = true;
			this._changeUrl(`Level ${this.levelNumber} | Paused`, `#level/${this.levelNumber}/paused`);
			this.interface.showPauseScreen();
		}
	}

}
