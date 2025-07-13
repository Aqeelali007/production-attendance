import express from 'express';
import bodyParser from 'body-parser';
import jwt from 'jsonwebtoken';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import puppeteer from 'puppeteer';
import fetch from 'node-fetch';
import path from "path";
import { fileURLToPath } from 'url';
import { timeout } from 'puppeteer';
import jsdom from 'jsdom';
import serverless from 'serverless-http';
import chromium from 'chrome-aws-lambda';

const { JSDOM } = jsdom;

const PORT = 4000;

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const SECRET_KEY = 'aqeel';

const app = express();

app.use(cors());
app.use(bodyParser.json());
app.use(cookieParser());

// Serve static files from the root directory
// console.log(path.join(__dirname, 'login.html'));
const browserURLs = [
  'http://localhost:9222',
  'http://localhost:9223',
  'http://localhost:9224',
  'http://localhost:9225',
  'http://localhost:9226'
];

let currentBrowserIndex = 0;

// Function to get the next browser in a round-robin fashion
const getNextBrowserURL = () => {
  const browserURL = browserURLs[currentBrowserIndex];
  currentBrowserIndex = (currentBrowserIndex + 1) % browserURLs.length;
  return browserURL;
};


const initBrowser = async () => {
  let browser;
  
  try {
    const browserURL = getNextBrowserURL();
    browser = await puppeteer.connect({
      browserURL,
      defaultViewport: null,
      timeout:2000,
      //headless: true,
      //args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-gpu'],
      //executablePath:'/usr/bin/chromium-browser',
    });
    console.log(`browser instance launched at ${currentBrowserIndex}`);
//    if(browser){
  //    console.log('browser instance launched');
    //}
 } 
 catch(error){
    console.log('error connecting to browser:',error);
 }
 // process.on('exit', () => {
  //    console.log("Process is exiting. Closing browser...");
   //   if (browser) {
   //     browser.close();
   //   }
  //  });
  return browser;
};

// Function to scrape attendance using Puppeteer
const scrapeAttendance = async (username, password) => {
  console.log("inside the main scraper");

//  const executablePath = await chromium.executablePath;
 // const browser = await puppeteer.launch({
    //console.log("browser launched");
   // headless: true,
   // args: ['--no-sandbox', '--disable-gpu',],
    //executablePath:'/usr/bin/chromium-browser',
    // defaultViewport: chromium.defaultViewport
  //});
  
  // const browser = await puppeteer.launch({
  //   headless: true,
  //   args: ['--no-sandbox', '--disable-gpu',]
   //});
  const browser = await initBrowser();
  //console.log("browser launched");
  const page = await browser.newPage();
  //console.log('page opened');

  const loginUrl = 'https://automation.vnrvjiet.ac.in/eduprime3';
  await page.goto(loginUrl, { waitUntil: 'domcontentloaded' });


	
  const usernameSelector = 'input[name="username"]';
  const passwordSelector = 'input[name="xpassword"]';
  const loginButtonSelector = 'input[type="submit"]';

  await page.waitForSelector(usernameSelector);
  await page.type(usernameSelector, username); 
  await page.waitForSelector(passwordSelector); 
  await page.type(passwordSelector, password); 
  await page.waitForSelector(loginButtonSelector); 
  await page.click(loginButtonSelector);
  //console.log("logging in");
  await page.waitForNavigation({ waitUntil: 'networkidle2' });

  //console.log("login navigation done");

  let studentId = null;

  const scriptTags = await page.$$eval('script', scripts => scripts.map(script => script.innerHTML));
  scriptTags.forEach(scriptContent => {
    const match = scriptContent.match(/studentId\s*=\s*(\d+)/);
    if (match) {
      studentId = match[1];
    }    
  });
  
  if (studentId) {
    console.log("Extracted student ID:", studentId);
    const mainUrl = `https://automation.vnrvjiet.ac.in/EduPrime3/Academic/Helper/GetStdAttPer?studentId=${studentId}&semId=undefined&_=1731680622299`;
    
    const jsonData = await page.evaluate(async (url) => 
      { 
        const response = await fetch(url); 
        return await response.json(); 
      }, mainUrl);

    // console.log('Extracted JSON Data:', jsonData); 
    
    const data = jsonData.Data;
    // console.log(data);

    const dom = new JSDOM(data);


    // Extract the table
    const table = dom.window.document.querySelector('.table-responsive table');
    const tableHtml = table ? table.outerHTML : '';

    // Output the extracted table HTML
    // console.log('Extracted Table HTML:', tableHtml);

    

    await page.close(); 
    await browser.disconnect();
    console.log("browser closed");
    return { studentId, tableHtml }; 
    } else { 
      console.log("Student ID not found."); 
      await page.close(); 
      await browser.disconnect();
      return { studentId: null, tableHtml: '' }; 
    }
};

const isAuthenticated = (req,res,next) =>{
  const token = req.cookies.token;
  if(token){
    next();
  }
  else{
    res.redirect('/');
  }
};

app.get('/', (req, res) => {
  // Serve login.html instead of index.html
  const token = req.cookies.token;
  if(token){
    res.sendFile(path.join(__dirname, 'public','home.html'));
  }
  else{
    // res.redirect('/');
    res.sendFile(path.join(__dirname, 'public','index.html'));
  }
});

app.post('/submit', async (req, res) => {
  console.log("into submit route");
  const username = req.body.username;
  console.log(username);
  const password = req.body.password;
  console.log(password);

  try {
    console.log("inside scraping");
    const attendanceData = await scrapeAttendance(username, password);
    
    const token = jwt.sign({ username }, SECRET_KEY, { expiresIn: '30d' });

    res.cookie('username', username, { maxAge: 30 * 24 * 60 * 60 * 1000, httpOnly: false });
    // res.cookie('client_username', username, { maxAge: 30 * 24 * 60 * 60 * 1000});
    res.cookie('password', password, { maxAge: 30 * 24 * 60 * 60 * 1000, httpOnly: false });
    // res.cookie('client_password', password, { maxAge: 30 * 24 * 60 * 60 * 1000});
    res.cookie('token', token, { maxAge: 30 * 24 * 60 * 60 * 1000, httpOnly: true });

    res.json({ success: true, attendanceData });
  } catch (error) {
    res.status(401).json({ success: false, message: 'Invalid credentials' });
  }
});

app.get('/attendance',isAuthenticated,(req,res) => {
  // console.log("inside the attendance route");
  res.sendFile(path.join(__dirname,'public','home.html'));
});

app.post('/logout',(req,res)=>{
  const username = 'username';
  const password = 'password';
  const token = 'token';
  res.clearCookie(username);
  res.clearCookie(password);
  res.clearCookie(token);
  res.redirect('/');
});

app.use(express.static(path.join(__dirname, 'public')));

app.listen(PORT,'0.0.0.0',()=>{
  console.log(`listening on ${PORT}`);
});
