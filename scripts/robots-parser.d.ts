/** Narrow declaration for the installed CommonJS module, whose package has no types. */
declare module 'robots-parser' {
 export default function robotsParser(url:string,contents:string):{
  isAllowed(url:string,userAgent?:string):boolean|undefined;
 };
}
