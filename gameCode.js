var moveVelocity = 250, jumpVelocity = 270, flyMax = 70, hitFull = false, fly = flyMax, health = 100;
var beeSpeed = 4.3, fireButton, fireballs, firetimeinterval = 500, firetime = 300, fireVelocity = 850;
var beeFireTimeInterval = 1000, beeFireTime = 400, beeFireVelocity = 600, explosions;
var mute = false, muteButtonClicked = false, isHurt = false, hitSide, levelComplete = false;

var level1 =
{
	preload:function()
	{
		// LOAD SPRITES
		game.load.spritesheet('loading', 'loadingscreen.png', 650, 352);
		game.load.spritesheet('man', 'man.png', 69, 89);
		game.load.spritesheet('bee', 'bee.png', 36, 41);
		game.load.spritesheet('fireball', 'fireball.png', 24, 24);
		game.load.spritesheet('explosion', 'kaboom.png', 49, 49);
		game.load.spritesheet('beebullet', 'beebullet.png', 16, 16);
		game.load.spritesheet('death', 'death.png', 64, 64);

		// LOAD TILEMAP
		game.load.tilemap('stuff', 'stuff.json', null, Phaser.Tilemap.TILED_JSON);

		// LOAD IMAGES
		game.load.image('tiles', 'MegaManX-StormEagle_bank.png');

		// LOAD AUDIO FILES
		game.load.audio('stage1', 'music2.mp3');
		game.load.audio('laser', 'laser.ogg');
		game.load.audio('destroy', 'destroy.ogg');
		game.load.audio('deathSound', 'death.ogg');
	},

	create:function()
	{
		// CREATE THE MAP
		////CHANGE WITH LEVELS////
		map = game.add.tilemap('stuff');
		map.addTilesetImage('MegaManX-StormEagle_bank', 'tiles');
		killers = map.createLayer('Killers');
		winner = map.createLayer('Winner');
		layer = map.createLayer('Background');
		layer2 = map.createLayer('Colliders');
		//////////////////////////

		layer.resizeWorld();
		map.setCollisionBetween(0, 2000, true, layer2);
		map.setCollisionBetween(1587, 1587, true, killers);
		map.setCollisionBetween(37, 37, true, winner);

		game.stage.backgroundColor = '#3498db';

		// START PHYSICS SYSTEM
		game.physics.startSystem(Phaser.Physics.ARCADE);

		// CREATE THE PLAYER
		player = game.add.sprite(50, 89, 'man');
		player.animations.add('left', [0, 1, 2, 3], 10, true);
		player.animations.add('right', [7, 8, 9, 6], 10, true);
		player.animations.add('stopRight', [5], 1, false);
		player.animations.add('stopLeft', [4], 1, false);
		player.animations.add('fallingRight', [8], 1, false);
		player.animations.add('fallingLeft', [2], 1, false);
		player.animations.add('fireRight', [10], 1, false);
		player.animations.add('fireLeft', [11], 1, false);
		hurtRight = player.animations.add('hurtRight', [12, 13, 12, 13, 12], 10, false);
		hurtLeft = player.animations.add('hurtLeft', [14, 15, 14, 15, 14], 10, false);
		hurtRight.onComplete.add(function(){isHurt=false}, null);
		hurtLeft.onComplete.add(function(){isHurt=false}, null);
		facing = 'right';
		player.health = health;

		// SET PHYSICS FOR PLAYER
		game.physics.arcade.enable(player);
		player.body.collideWorldBounds = true;
		player.body.gravity.y = 320;

		// SET UP THE CAMERA
		game.camera.follow(player);
		game.camera.deadzone = new Phaser.Rectangle(250, 100, 100, 100);

		cursors = game.input.keyboard.createCursorKeys();

		// CREATE ENEMIES
		////CHANGE WITH LEVELS////
		beeStartingPositions = [{x:970, y:89}, {x:1010, y:210}, {x:2050, y:75}, {x:3070, y:140},
		{x:2800, y:600}, {x:1970, y:650}, {x:1970, y:750}];
		//////////////////////////

		bees = game.add.group();
		for (i = 0; i < beeStartingPositions.length; i++)
		{
			bee = bees.create(beeStartingPositions[i].x, beeStartingPositions[i].y, 'bee');
			this.setupBees(bee);
		}

		// CREATE EXPLOSIONS
		explosions = game.add.group();
		explosions.createMultiple(30, 'explosion');
		explosions.forEach(this.setupExplosions, this);

		// CREATE PLAYER'S DEATH ANIMATION
		deathAnim = game.add.sprite(player.x+12, player.y+16, 'death');
		deathAnim.visible = false;
		anim = deathAnim.animations.add('death', [0,1,2,3,4,5,6,7,8], 6, false, true);
		anim.onComplete.add(this.deathComplete, this);

		// CREATE PLAYER FIREBALLS
		fireballs = game.add.group();
		fireballs.enableBody = true;
		fireballs.createMultiple(10, 'fireball', 0);
		fireballs.setAll('anchor.x', 0.5);
		fireballs.setAll('anchor.y', 1);
		fireballs.setAll('outOfBoundsKill', true);
    	fireballs.setAll('checkWorldBounds', true);

    	// CREATE ENEMY FIREBALLS
    	enemyFires = game.add.group();
    	enemyFires.enableBody = true;
    	enemyFires.createMultiple(10, 'beebullet');
    	enemyFires.setAll('anchor.x', 0.5);
		enemyFires.setAll('anchor.y', 1);
		enemyFires.setAll('outOfBoundsKill', true);
    	enemyFires.setAll('checkWorldBounds', true);
    	enemyFires.setAll('damage', 12);

    	fireButton = game.input.keyboard.addKey(Phaser.Keyboard.SPACEBAR);

    	// CREATE MUSIC AND AUDIO
    	stage1Music = game.add.audio('stage1', 0.4, true);
    	stage1Music.play();
    	laser = game.add.audio('laser', 0.1, false);
    	destroy = game.add.audio('destroy', 0.1, false);
    	deathSound = game.add.audio('deathSound', 0.3, false);

    	healthText = game.add.text(10, 10, player.health, {font: "32px Arial", fill: "#ff0044", align: "center"});
    	healthText.fixedToCamera = true;
    	healthText.cameraOffset = new Phaser.Point(10, 10);

    	// CREATE THE LOADING SCREEN
		loadingscreen = game.add.sprite(0, 0, 'loading');
		loadingscreen.animations.add('load', [0, 1, 2, 3], 3, true);
	},

	setupBees:function(obj) // function to set up the bees initially
	{
		obj.animations.add('defLeft', [0,1,2,3,4,5], 10, true); // Every bee will have a left facing animation
		obj.animations.add('defRight', [6,7,8,9,10,11], 10, true); // Every bee will have a right facing animation
		obj.beeSpeed = beeSpeed; // Every bee will have its own speed variable so not all bees move at the same time
		obj.beeFireTime = 0; // Every bee will have its own fire timer, so they may fire their own bullets at the same time
		game.physics.arcade.enable(obj); // Finally, enable arcade physics on the bee
	},

	setupExplosions:function(obj) // function to set up the explosions initially
	{
		obj.animations.add('explosion'); // Just add the explosion animation
	},

	fireballHitEnemy:function(fireball, enemy) // function called when player's fireball overlaps an enemy
	{
		enemy.kill(); // kill the enemy
		fireball.kill(); // kill the fireball
		var explosion = explosions.getFirstExists(false); // make an explosion
    	explosion.reset(enemy.body.x, enemy.body.y); // reset the positon of the explosion the same as enemy's
    	explosion.play('explosion', 20, false, true); // play the animation at 20fps, dont loop, kill it after animation ends
    	destroy.play(); // play the 'destroy' sound effect
	},

	playerHit:function(player, enemyFireBall) // function called when enemy hits player
	{
		if (player.health > enemyFireBall.damage)
		{
			if (enemyFireBall.x > player.x) hitSide = 'right';
			else hitSide = 'left';
			enemyFireBall.kill();
			destroy.play();
			isHurt = true;
			player.health -= enemyFireBall.damage;
		}
		else
		{
			player.health = 0;
			this.die();
		}
	},

	fire:function() // function called when player presses the fire button
	{
		if (firetime < game.time.now)
		{
			fire = fireballs.getFirstExists(false);
			if (facing === 'right')
			{
				fire.reset(player.x+60, player.y+65);
				fire.body.velocity.x = fireVelocity;
			}
			else
			{
				fire.reset(player.x+10, player.y+65);
				fire.body.velocity.x = -fireVelocity;
			}
			laser.play();
			firetime = firetimeinterval + game.time.now;
		}
	},

	updateBees:function(enemyBee) // separate update function for the enemy bees
	{
		if (enemyBee.inCamera)
		{
			if (player.x > enemyBee.x) enemyBee.animations.play('defRight');
			else enemyBee.animations.play('defLeft');

			if (Math.round(enemyBee.y) > game.camera.y + game.camera.height - 5 || Math.round(enemyBee.y) < game.camera.y + 5)
			{
				enemyBee.beeSpeed = -enemyBee.beeSpeed;
			}
			enemyBee.y += enemyBee.beeSpeed;
			if (enemyBee.beeFireTime < game.time.now && enemyBee.alive)
			{
				enemyBee.beeFire = enemyFires.getFirstExists(false);
				if (player.x > enemyBee.x)
				{
					enemyBee.beeFire.reset(enemyBee.x+15, enemyBee.y+32);
					enemyBee.beeFire.body.velocity.x = beeFireVelocity;
				}
				else
				{
					enemyBee.beeFire.reset(enemyBee.x+30, enemyBee.y+32);
					enemyBee.beeFire.body.velocity.x = -beeFireVelocity;
				}
				enemyBee.beeFireTime = beeFireTimeInterval + game.time.now;
			}
		}
	},

	die:function()
	{
		player.kill();
		deathAnim.reset(player.x+12, player.y+30);
		deathAnim.visible = true;
		stage1Music.stop();
		deathSound.play();
		deathAnim.animations.play('death');
	},

	deathComplete:function()
	{
		game.sound.remove('stage1');
		game.state.remove('level1');
		game.state.add('level1', level1);
		game.state.start('level1');
	},

	level1Complete:function()
	{
		levelComplete = true;
		game.add.text(game.camera.x + game.camera.width / 2 - 200, game.camera.y + game.camera.height / 2, "Level 1 Complete!", {font:"54px Arial Bold", fill:"#FFAA00", align:"center"});
	},

	update:function()
	{
		game.physics.arcade.collide(player, layer2);

		bees.forEachAlive(this.updateBees, this);
		game.physics.arcade.overlap(fireballs, bees, this.fireballHitEnemy, null, this);
		game.physics.arcade.overlap(enemyFires, player, this.playerHit, null, this);
		game.physics.arcade.overlap(player, killers, this.die, null, this);
		game.physics.arcade.overlap(player, winner, this.level1Complete, null, this);

		fireballs.forEach(function(obj)
    	{
    		if (obj.x <= game.camera.x || obj.x >= game.camera.x + game.camera.width)
    			obj.kill();
    	});

		// Do not let the player play until sounds are loaded
    	if (!this.cache.isSoundDecoded('stage1'))
    	{
    		loadingscreen.animations.play('load');
    		return;
    	}
    	else loadingscreen.kill();
    	// End sound load check

    	if (!isHurt && !levelComplete)
    	{
			if (fireButton.isDown) this.fire();

			if (cursors.left.isDown)
			{
				player.body.velocity.x = -moveVelocity;
				facing = 'left';
			}

			else if (cursors.right.isDown)
			{
				player.body.velocity.x = moveVelocity;
				facing = 'right';
			}

			else player.body.velocity.x = 0;

			if (facing === 'left' && !cursors.up.isDown)
			{
				if (player.body.velocity.x != 0) player.animations.play('left');
				else if (player.body.velocity.x == 0 && fireButton.isDown) player.animations.play('fireLeft');
				else player.animations.play('stopLeft');
			}

			else if (facing === 'right' && !cursors.up.isDown)
			{
				if (player.body.velocity.x != 0) player.animations.play('right');
				else if (player.body.velocity.x == 0 && fireButton.isDown) player.animations.play('fireRight');
				else player.animations.play('stopRight');
			}

			if (cursors.up.isDown && fly > 0 && hitFull === false)
			{
				if (facing === 'left') player.animations.play('left');
				else player.animations.play('right');
				player.body.velocity.y = -jumpVelocity;
				fly -= 10;
				if (facing === 'left' && fly <= 0) 
				{
					player.animations.play('fallingLeft');
				}
				else if (facing === 'right' && fly <= 0)
				{
					player.animations.play('fallingRight');
				}
				if (fly <= 0) hitFull = true;
			}

			else if (player.body.velocity.y >= -jumpVelocity && fly < flyMax) fly += 0.7;

			if (fly >= flyMax && hitFull === true) hitFull = false;

			if (player.body.velocity.y != 0 && !cursors.up.isDown && player.body.velocity.x == 0)
			{
				if (facing === 'left') player.animations.play('fallingLeft');
				else player.animations.play('fallingRight');
			}
		}

		else if (levelComplete) { }

		else
		{
			if (facing === 'right') player.animations.play('hurtRight');
			else player.animations.play('hurtLeft');
			if (hitSide === 'right') player.body.velocity.x = -70;
			else player.body.velocity.x = 70;
		}

		if (Math.round(fly) > flyMax) fly = flyMax;

		if (muteButtonClicked)
		{
			mute = !mute;
			if (mute == true) stage1Music.stop();
			else if (!stage1Music.isPlaying) stage1Music.play();
			muteButtonClicked = false;
		}
		healthText.setText(player.health);
	}
};

var game = new Phaser.Game(650, 352, Phaser.CANVAS, 'gameArea');
game.state.add('level1', level1);
game.state.start('level1');