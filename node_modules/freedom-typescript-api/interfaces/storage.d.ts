/**
 * freedom/interface/storage.js
 *
 * Typescript definitions for the Freedom Storage API.
 */

/// <reference path='promise.d.ts' />

// Interfaces for Freedom social API
declare module freedom.Social {

  // Scope preferences when accessing stoarge.
  // TODO: Enums should not be in this d.ts file (or any of the other interface
  // files in freedom-typescript-api.) Find a better way to organize some
  // regular .ts files to generate real js output, so Enums can work at runtime
  // with additional hacks. At the moment, this particular enum isn't actually
  // used by uProxy, so we'll wait until this becomes necessary.
  enum SCOPE {
    SESSION = 0,
    DEVICE_LOCAL,
    USER_LOCAL,
    SHARED
  }

}  // declare module freedom.Storage

// The Freedom Storage class
declare module freedom {

  class Storage {

    /**
     * Fetch array of all keys.
     */
    keys() : string[];

    /**
     * Fetch a value for a key.
     */
    get(key :string) : Promise<string>;

    /**
     * Sets a value to a key. Fulfills promise with the previous value, if it
     * exists.
     */
    set(key :string, value :string) : Promise<string>;

    /**
     * Remove a single key. Fulfills promise with previous value, if exists.
     */
    remove(key :string) : Promise<string>;

    /**
     * Remove all data from storage.
     */
    clear() : Promise<void>;

  }  // class Storage

}  // declare module Freedom
