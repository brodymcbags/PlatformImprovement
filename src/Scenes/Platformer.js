class Platformer extends Phaser.Scene {
    constructor() {
        super("platformerScene");
    }

    init() {
        // variables and settings
        this.ACCELERATION = 400;
        this.DRAG = 500;    // DRAG < ACCELERATION = icy slide
        this.physics.world.gravity.y = 1500;
        this.JUMP_VELOCITY = -600;
        this.PARTICLE_VELOCITY = 50;
        this.SCALE = 2.5;
        this.score = 0;
        this.scoreText = null; 


    }

    create() {
        // Create a new tilemap game object which uses 18x18 pixel tiles, and is
        // 45 tiles wide and 25 tiles tall.
        this.map = this.add.tilemap("platformer-level-1", 18, 18, 45, 25);

        // Add a tileset to the map
        // First parameter: name we gave the tileset in Tiled
        // Second parameter: key for the tilesheet (from this.load.image in Load.js)
        this.tileset = this.map.addTilesetImage("kenny_tilemap_packed", "tilemap_tiles");

        // Create a layer
        this.groundLayer = this.map.createLayer("Ground-n-Platforms", this.tileset, 0, 0);

        // Make it collidable
        this.groundLayer.setCollisionByProperty({
            collides: true
        });

         // Create score text (fixed to camera)

         this.scoreText = this.add.text(430, 270, 'Score: 0', {
             fontSize: '25px',
             fontFamily: 'Arial',
             color: '#ffffff',
             stroke: '#000000',
             strokeThickness: 4,
             padding: { x: 10, y: 5 },
         });
 
         
         // This makes the text stay in the same position on screen regardless of camera movement
         this.scoreText.setScrollFactor(0);
         this.scoreText.setDepth(9999); // Ensure it's always on top

         //coin animation
         this.anims.create({
            key: "coin_spin",
            frames: [
              { key: "tilemap_sheet", frame: 151 },
              { key: "tilemap_sheet", frame: 152 }  
            ],
            frameRate: 5,  // 0.2 s per cycle
            repeat: -1     // loop forever
          });
        
        // Find water tiles
        this.waterTiles = this.groundLayer.filterTiles(tile => {
            return tile.properties.water == true;
        });
        

        // TODO: Add createFromObjects here
        // Find coins in the "Objects" layer in Phaser
        // Look for them by finding objects with the name "coin"
        // Assign the coin texture from the tilemap_sheet sprite sheet
        // Phaser docs:
        // https://newdocs.phaser.io/docs/3.80.0/focus/Phaser.Tilemaps.Tilemap-createFromObjects
        /*
        this.coins = this.map.createFromObjects("Objects", {
            name: "coin",
            key: "tilemap_sheet",
            frame: 151
        });
        */

        const objectsLayer = this.map.getObjectLayer("Objects");
        this.coins = this.physics.add.staticGroup();

        objectsLayer.objects.forEach(obj => {
            if (obj.name === "coin") {                
            const sprite = this.coins.create(obj.x, obj.y - this.map.tileHeight, "tilemap_sheet", 24);
            sprite.play("coin_spin");
            }   
        });
        
        this.spawn = this.map.createFromObjects("Objects", {
            name: "spawn",
            key: "tilemap_sheet",
            frame: 88
        });
        this.powerUp = this.map.createFromObjects("Objects", {
            name: "powerUp",
            key: "tilemap_sheet",
            frame: 128
        });
        // TODO: Add turn into Arcade Physics here
        this.physics.world.enable(this.waterTiles, Phaser.Physics.Arcade.STATIC_BODY);

        this.physics.world.enable(this.coins, Phaser.Physics.Arcade.STATIC_BODY);
        this.physics.world.enable(this.powerUp, Phaser.Physics.Arcade.STATIC_BODY);

        this.coinGroup = this.coins;
        
        /*
        objectsLayer.objects.forEach(obj => {
            if (obj.name === "coin") {                // skip power‑ups, etc.
              const sprite = coins.create(obj.x, obj.y - map.tileHeight, "tiles", 24);
              sprite.play("coin_spin");
            }
          });
          */

        // set up player avatar
        const spawnPoint = this.map.findObject("Objects", obj => obj.name === "spawn");
        my.sprite.player = this.physics.add.sprite(spawnPoint.x, spawnPoint.y, "platformer_characters", "tile_0000.png");
        // my.sprite.player = this.physics.add.sprite(30, 345, "platformer_characters", "tile_0000.png");
        my.sprite.player.setCollideWorldBounds(true);

        // Enable collision handling
        this.physics.add.collider(my.sprite.player, this.groundLayer);

        // coin juice
        my.vfx.boinCollect = this.add.particles(0, 0, "kenny-particles", {
            frame: ['star_07.png', 'star_08.png'],
            // TODO: Try: add random: true
            random: false,

            scale: {start: 0.02, end: 0.5},
            // TODO: Try: maxAliveParticles: 8,
            maxAliveParticles: 8,

            lifespan: 100,
            // TODO: Try: gravityY: -400,
            gravityY: -400,

            alpha: {start: 1, end: 0.1}, 
        });

        my.vfx.boinCollect.stop();

        //power up juice
        my.vfx.PUCollect = this.add.particles(0, 0, "kenny-particles", {
            frame: ['spark_01.png', 'spark_02.png','spark_03.png','spark_04.png'],
            // TODO: Try: add random: true
            random: false,

            scale: {start: 0.06, end: 0.12},
            // TODO: Try: maxAliveParticles: 8,
            maxAliveParticles: 3,

            lifespan: 300,

            alpha: {start: 1, end: 0.1}, 


        });

        my.vfx.PUCollect.stop();


        //power up collision handler
        this.physics.add.overlap(my.sprite.player, this.powerUp, (obj1, obj2) => {
            obj2.destroy(); 

            my.vfx.boinCollect.start();
            my.vfx.boinCollect.startFollow(my.sprite.player, my.sprite.player.displayWidth/2-10, my.sprite.player.displayHeight/2-5, false);
            my.vfx.boinCollect.setParticleSpeed(this.PARTICLE_VELOCITY, 0);
            this.time.delayedCall(100, () => {
                my.vfx.boinCollect.stop();
            });
            
            // add to score
            this.score += 100;
            this.scoreText.setText('Score: ' + this.score);
            console.log(this.score)

            this.time.addEvent({
                callback: () => this.PowerUp(),
            });

        });

        // Coin collision handler
        this.physics.add.overlap(my.sprite.player, this.coinGroup, (obj1, obj2) => {
            obj2.destroy(); 

            my.vfx.boinCollect.start();
            my.vfx.boinCollect.startFollow(my.sprite.player, my.sprite.player.displayWidth/2-10, my.sprite.player.displayHeight/2-5, false);
            my.vfx.boinCollect.setParticleSpeed(this.PARTICLE_VELOCITY, 0);

            this.time.delayedCall(100, () => {
                my.vfx.boinCollect.stop();
            });

            // add to score
            this.score += 10; 
            this.scoreText.setText('Score: ' + this.score);
            console.log(this.score)


        });

       
        // wheh player touches water effects
        
        //this.waterTiles.forEach(t => t.setCollision(true));
        

        this.physics.add.overlap(my.sprite.player, this.waterTiles, (obj1, obj2) => {
            console.log("sdadsd")
            my.sprite.player.setVelocityX(0);
            my.sprite.player.setVelocityY(100);

            this.time.delayedCall(2000, () => {
                player.setPosition(this.spawnPoint.x, this.spawnPoint.y);
            })
        });
         /*
        // 2.  Register a collider between the player and *that same* layer
        this.physics.add.collider(this.player, this.groundLayer, (player, tile) => {
        // the callback fires for every colliding tile;
        // just test the property to know it’s water
        if (tile.properties.water) {
            // reset velocity and position
            player.setVelocity(0, 0);
            player.setPosition(this.spawnPoint.x, this.spawnPoint.y);
        }
        });
        */

        // set up Phaser-provided cursor key input
        cursors = this.input.keyboard.createCursorKeys();

        this.rKey = this.input.keyboard.addKey('R');

        // debug key listener (assigned to D key)
        this.input.keyboard.on('keydown-D', () => {
            this.physics.world.drawDebug = this.physics.world.drawDebug ? false : true
            this.physics.world.debugGraphic.clear()
        }, this);

        // TODO: Add movement vfx here
        my.vfx.walking = this.add.particles(0, 0, "kenny-particles", {
            frame: ['smoke_03.png', 'smoke_09.png'],
            // TODO: Try: add random: true
            random: false,

            scale: {start: 0.03, end: 0.1},
            // TODO: Try: maxAliveParticles: 8,
            maxAliveParticles: 8,

            lifespan: 150,
            // TODO: Try: gravityY: -400,
            gravityY: -400,

            alpha: {start: 1, end: 0.1}, 
        });

        my.vfx.walking.stop();

        
        
        // TODO: add camera code here
        this.cameras.main.setBounds(0, 0, this.map.widthInPixels, this.map.heightInPixels);
        this.cameras.main.startFollow(my.sprite.player, true, 0.25, 0.25); // (target, [,roundPixels][,lerpX][,lerpY])
        this.cameras.main.setDeadzone(50, 50);
        this.cameras.main.setZoom(this.SCALE);
        

    }

    update() {
        if(cursors.left.isDown) {
            my.sprite.player.setAccelerationX(-this.ACCELERATION);
            my.sprite.player.resetFlip();
            my.sprite.player.anims.play('walk', true);
            // TODO: add particle following code here
            my.vfx.walking.startFollow(my.sprite.player, my.sprite.player.displayWidth/2-10, my.sprite.player.displayHeight/2-5, false);

            my.vfx.walking.setParticleSpeed(this.PARTICLE_VELOCITY, 0);

            // Only play smoke effect if touching the ground

            if (my.sprite.player.body.blocked.down) {

                my.vfx.walking.start();

            }
        } else if(cursors.right.isDown) {
            my.sprite.player.setAccelerationX(this.ACCELERATION);
            my.sprite.player.setFlip(true, false);
            my.sprite.player.anims.play('walk', true);
            // TODO: add particle following code here
            my.vfx.walking.startFollow(my.sprite.player, my.sprite.player.displayWidth/2-10, my.sprite.player.displayHeight/2-5, false);

            my.vfx.walking.setParticleSpeed(this.PARTICLE_VELOCITY, 0);

            // Only play smoke effect if touching the ground

            if (my.sprite.player.body.blocked.down) {

                my.vfx.walking.start();

            }
        } else {
            // Set acceleration to 0 and have DRAG take over
            my.sprite.player.setAccelerationX(0);
            my.sprite.player.setDragX(this.DRAG);
            my.sprite.player.anims.play('idle');
            // TODO: have the vfx stop playing
            my.vfx.walking.stop();

        }

        // player jump
        // note that we need body.blocked rather than body.touching b/c the former applies to tilemap tiles and the latter to the "ground"
        if(!my.sprite.player.body.blocked.down) {
            my.sprite.player.anims.play('jump');
        }
        if(my.sprite.player.body.blocked.down && Phaser.Input.Keyboard.JustDown(cursors.up)) {
            my.sprite.player.body.setVelocityY(this.JUMP_VELOCITY);
        }

        if(Phaser.Input.Keyboard.JustDown(this.rKey)) {
            this.scene.restart();
        }
    }
    PowerUp() {
        //up the power of the jump
        this.physics.world.gravity.y = 1400;
        this.JUMP_VELOCITY = -700;
        // add effects while in power up
        my.vfx.PUCollect.start();
            my.vfx.PUCollect.startFollow(my.sprite.player, my.sprite.player.displayWidth/2-10, my.sprite.player.displayHeight/2-5, false);
            my.vfx.PUCollect.setParticleSpeed(this.PARTICLE_VELOCITY, 0);
            

        //stop jump power up 
        this.time.delayedCall(7000, () => {
            this.physics.world.gravity.y = 1500;
            this.JUMP_VELOCITY = -600;
            my.vfx.PUCollect.stop();

        });

    }
}