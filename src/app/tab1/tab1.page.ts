import { Component, ElementRef, OnInit, ViewChild } from '@angular/core';
import { HttpClient } from '@angular/common/http';

//import * as ePub from 'epubjs';
import ePub from 'epubjs';
import JSEncrypt from 'jsencrypt';

import * as JSZip from 'jszip';
//const forge = require('node-forge');
import * as forge from 'node-forge'; // Add missing import for the 'forge' library

@Component({
  selector: 'app-tab1',
  templateUrl: 'tab1.page.html',
  styleUrls: ['tab1.page.scss'],
})
export class Tab1Page implements OnInit {
  constructor(private http: HttpClient) {}
  @ViewChild('viewer') viewer!: ElementRef;

  currentPage = 1;

  // book: any = ePub.Book;
  book: any;

  rendition: any;

  privateKey =
    'fGYVX8obUSXJhD5mFJaJfKLaftMMe2dPEAcquOCHgPjbQRqKxNJ8qISjqck5hk7FrfiGfj10uk/eQwg1Zv9ChGdJEp8rVs8XmM6wKVP5sPZ1+u4pbevZ2V5GTOJSXx3U3EZxc2PUhhzRlhQo//bLah0zHYgPmy7/92lDecEitvPnlHgYDiS6TB99VmIWpOTgG05c6id15/CX6ZjDnF6ml2hS+IAvPffkxl1pT6+bvSlZggCBHqL7xJqUhQlNcBFNMhSsK8uus1UmC9XQQ3bVbI7GxLLka71jy46eGPA3mkfJcA7gYJTagq6SEg+nCXDAIoO6hn7DTUi6vjGjS0qZTlrDD+JPIG1fZwGuPPhMbG80Tl5RyyAWxydCAdZyW5T4zqzUCDQx6cE6qd6Aav6Oig4WrH346JaJ9qvwe3yENe3ioVZex90rD1qdi1JLlYo1sJErY+7pyoixLLGYJKfT0hTgUKlcjwP/+g/dWn09LCc0MB/rhy0G03o4zzUPhcKKLP0QqgQnqoPElv8nGW0bXw==';

  ngOnInit() {
    //   this.book = new ePub.Book('../../assets/poem.epub');
    //  const epubUrl = '../../assets/poem.epub';
    this.loadEpub();
  }

  deviceId = localStorage.getItem('deviceId');
  if(deviceId: any) {
    deviceId = this.generateUUID();
    localStorage.setItem('deviceId', deviceId);
  }

  generateUUID() {
    // This is a simple UUID generator, you might want to use a more robust implementation
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(
      /[xy]/g,
      function (c) {
        var r = (Math.random() * 16) | 0,
          v = c == 'x' ? r : (r & 0x3) | 0x8;
        return v.toString(16);
      }
    );
  }

  decryptPrivateKey(key: any) {
    if (!key || !key.length) throw new Error('Invalid Argument: key');

    const md = forge.md.sha256.create();
    md.update(this.generateUUID(), 'utf8');
    const hash = md.digest().toHex();

    let data = forge.util.createBuffer(hash, 'utf8');
    for (let i = 1; i <= 16; i++) {
      // const byte =
      //   data.getBytes(i) + data.getBytes(i + 13) - data.getBytes(24 - i, 0);
      // data.putBytes(byte, i + 8);
    }

    const pwd = data.getBytes(16);

    const rsaKey = forge.util.decode64(key);

    const decipher = forge.cipher.createDecipher('AES-CBC', pwd);
    decipher.start({ iv: pwd });
    decipher.update(forge.util.createBuffer(rsaKey));
    decipher.finish();

    const decrypted = decipher.output.getBytes();

    return decrypted;
  }

  // async loadEpub() {
  //   //*** */
  //   const privateKey = this.decryptPrivateKey(this.privateKey);
  //   console.log(privateKey);

  //   const epubUrl = '../../assets/poems.epub';
  //   // Load the ePub file as a binary blob
  //   const response = await fetch(epubUrl);
  //   const blob = await response.blob();
  //   // Read the blob as an ArrayBuffer
  //   const arrayBuffer = await blob.arrayBuffer();
  //   // Initialize the JSZip instance
  //   const zip = new JSZip();
  //   // Load the EPUB content into JSZip
  //   await zip.loadAsync(arrayBuffer);
  //   // Access the files in the EPUB
  //   const files = zip.files;
  //   console.log(files);
  //   console.log(files['key']);
  // }

  decryptEpubKey(key: any, rsa: any) {
    // Decode the RSA private key
    const privateKey = forge.pki.privateKeyFromPem(atob(rsa));

    // Decrypt the key
    const decrypted = privateKey.decrypt(forge.util.decode64(key), 'RSA-OAEP');

    // Parse the decrypted key
    const epubKey = {
      validFrom: new Date(decrypted.substring(0, 10)),
      validTo: new Date(decrypted.substring(10, 20)),
      key: new TextEncoder().encode(decrypted.substring(20)),
    };

    return epubKey;
  }

  async decryptChapter(data: any, key: any) {
    // Create a CryptoKey object from the key
    const cryptoKey = await window.crypto.subtle.importKey(
      'raw',
      key,
      { name: 'AES-CBC', length: 256 },
      false,
      ['decrypt']
    );

    // Decrypt the data
    const decrypted = await window.crypto.subtle.decrypt(
      { name: 'AES-CBC', iv: key },
      cryptoKey,
      data
    );

    // Convert the decrypted data to a Uint8Array and return it
    return new Uint8Array(decrypted);
  }

  async loadEpub() {
    //*** */
    const privateKey = this.decryptPrivateKey(this.privateKey);
    console.log(privateKey);

    const epubUrl = '../../assets/poems.epub';
    // Load the ePub file as a binary blob
    const response = await fetch(epubUrl);
    const blob = await response.blob();
    // Read the blob as an ArrayBuffer
    const arrayBuffer = await blob.arrayBuffer();
    // Initialize the JSZip instance

    const zip = new JSZip();
    // Load the EPUB content into JSZip
    await zip.loadAsync(arrayBuffer);
    // Access the files in the EPUB
    const files = zip.files;
    console.log(files);
    console.log(files['key']);

    // Decrypt the key
    const keyFile = files['key'];
    const keyContent = await keyFile.async('string');
    console.log(keyContent);
    const encoder = new TextEncoder();

    // Convert the string to a Uint8Array
    const keyByteArray = encoder.encode(keyContent);
    console.log(keyByteArray);

    //    const rsaPrivateKey = encoder.encode(this.privateKey);

    const decryptedKey = this.decryptEpubKey(keyContent, this.privateKey);
    console.log(decryptedKey);

    // Load the ePub file as a binary blob
    // const response = await fetch(epubUrl);
    // console.log(response);
    // const blob = await response.blob();
    // console.log(blob);

    // *
    // const zip0 = new JSZip();
    // zip0.loadAsync(arrayBuffer).then(async function(zip) {
    //     const chapEntry = zip.file("OEBPS/" + CATALOG_FILE_NAME);

    // Read the blob as an ArrayBuffer
    // const arrayBuffer = await blob.arrayBuffer();

    // Initialize the ePub book with the ArrayBuffer
    const book = ePub(arrayBuffer, { encoding: 'UTF-8' });
    console.log(book);

    // Render the book to the viewer element
    this.rendition = book.renderTo('viewer', {
      width: '500',
      height: '500',
      allowScriptedContent: true,
    });
    // console.log(rendition);
    this.rendition.display();
  }

  nextPage() {
    this.rendition.next(); // to display the page
  }

  // to display the current page
  prevPage() {
    this.rendition.prev();
  }

  // ****
}

function parseCatalogContent(stream: any) {
  // Assuming the catalog content is in JSON format
  const catalogContent = JSON.parse(stream);

  // Return the parsed content, adjust this part according to your actual parsing logic
  return catalogContent;
}

function generateStreamFromString(str: any) {
  // Convert the string to a Uint8Array
  const uint8array = new TextEncoder().encode(str);

  // Create a readable stream from the Uint8Array
  const stream = new ReadableStream({
    start(controller) {
      // Push the Uint8Array chunks into the stream
      controller.enqueue(uint8array);
      // Close the stream
      controller.close();
    },
  });

  return stream;
}
