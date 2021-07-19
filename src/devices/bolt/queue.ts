import { Bolt } from './bolts';

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
	async write ( data:any, callback:any ) {

		try {
			await data.charac.writeValue(new Uint8Array(data.command));
			console.log('write', data.charac.uuid, data.command);

		} catch(error) { 
			console.log(error.message);	
		
		} finally {
			callback && callback();

		}

	}

	runCommand (data: any) {
		this.running = true;
		this.write( data, () => {
			this.running = false;
			if (this.queue.length > 0) {
				this.runCommand(this.queue.shift());
			}
		})
	}

	append (data: any) {
		!this.running ? this.runCommand(data) : this.queue.push(data);
	}

}