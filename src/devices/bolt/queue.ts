import { Bolt } from './bolt';

/* The objective of this queue is to send packets in turns to avoid GATT error */
export class Queue {

  private running: any;
  private queue: any[]
  // private bolt:Bolt;

	constructor () {
    // this.bolt = bolt;
		this.running = false;
		this.queue = [];
	}

	/*  Write a command on a specific characteristic*/
	async write ( paket:any, callback:any ) {

		try {
			await paket.charac.writeValue(new Uint8Array(paket.command));
			console.log('Write', paket.bolt.name, paket.command);

		} catch(error) { 
			console.log(error.message);	
		
		} finally {
			callback && callback();

		}

	}

	runCommand (paket: any) {
		this.running = true;
		this.write( paket, () => {
			this.running = false;
			if (this.queue.length > 0) {
				this.runCommand(this.queue.shift());
			}
		})
	}

	append (paket: any) {
		!this.running ? this.runCommand(paket) : this.queue.push(paket);
	}

}