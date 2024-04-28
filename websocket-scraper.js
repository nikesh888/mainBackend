// scraper.js
import { chromium } from "playwright";
import { WebSocketServer } from "ws";

const scraperWs = async () => {
  const wss = new WebSocketServer({ port: 8080 });
  const browser = await chromium.launch({ headless: true });
  // Create a new browser context
  const context = await browser.newContext();
  console.log(`WebSocket running port:8080`);
  wss.on("connection", async (ws, req) => {
    const { url } = req;
    const urlParams = new URLSearchParams(url);
    const keyword = urlParams.get("/?keyword");
    const pincode = urlParams.get("pincode");
    console.log("Client connected");

    let googleUrl = `https://www.google.com/maps/search/${keyword}+${pincode}/data=!3m1!4b1?entry=ttu`;
    console.time("Execution Time");
    const page = await context.newPage();
    await page.evaluate((url) => {
      window.location.href = url;
    }, googleUrl);
    await page.waitForSelector('[jstcache="3"]');
    const scrollable = await page.$(
      "xpath=/html/body/div[2]/div[3]/div[8]/div[9]/div/div/div[1]/div[2]/div/div[1]/div/div/div[1]/div[1]"
    );
    if (!scrollable) {
      console.log("Scrollable element not found.");
      // await browser.close();
      return;
    }
    const batchSize = 10;
    const results = [];
    const initialUrls = await page.$$eval("a", (links) =>
      links
        .map((link) => link.href)
        .filter((href) => href.startsWith("https://www.google.com/maps/place/"))
    );
    for (let i = 0; i < initialUrls.length; i += batchSize) {
      const batchUrls = initialUrls.slice(i, i + batchSize);
      const batchResults = await Promise.all(
        batchUrls.map(async (url) => {
          const newPage = await context.newPage();
          await newPage.evaluate((url) => {
            window.location.href = url;
          }, url);
          await newPage.waitForSelector('[jstcache="3"]');
          const nameElement = await newPage.$(
            "xpath=/html/body/div[2]/div[3]/div[8]/div[9]/div/div/div[1]/div[2]/div/div[1]/div/div/div[2]/div/div[1]/div[1]/h1"
          );
          let name = nameElement
            ? await newPage.evaluate(
                (element) => element.textContent,
                nameElement
              )
            : "";
          name = `"${name}"`;
          const ratingElement = await newPage.$(
            "xpath=/html/body/div[2]/div[3]/div[8]/div[9]/div/div/div[1]/div[2]/div/div[1]/div/div/div[2]/div/div[1]/div[2]/div/div[1]/div[2]/span[1]/span[1]"
          );
          let rating = ratingElement
            ? await newPage.evaluate(
                (element) => element.textContent,
                ratingElement
              )
            : "";
          rating = `"${rating}"`;
          const reviewsElement = await newPage.$(
            "xpath=/html/body/div[2]/div[3]/div[8]/div[9]/div/div/div[1]/div[2]/div/div[1]/div/div/div[2]/div/div[1]/div[2]/div/div[1]/div[2]/span[2]/span/span"
          );
          let reviews = reviewsElement
            ? await newPage.evaluate(
                (element) => element.textContent,
                reviewsElement
              )
            : "";
          reviews = reviews.replace(/\(|\)/g, "");
          reviews = `"${reviews}"`;
          const categoryElement = await newPage.$(
            "xpath=/html/body/div[2]/div[3]/div[8]/div[9]/div/div/div[1]/div[2]/div/div[1]/div/div/div[2]/div/div[1]/div[2]/div/div[2]/span/span/button"
          );
          let category = categoryElement
            ? await newPage.evaluate(
                (element) => element.textContent,
                categoryElement
              )
            : "";
          category = `"${category}"`;
          const addressElement = await newPage.$(
            'button[data-tooltip="Copy address"]'
          );
          let address = addressElement
            ? await newPage.evaluate(
                (element) => element.textContent,
                addressElement
              )
            : "";
          address = `"${address}"`;
          const websiteElement =
            (await newPage.$('a[data-tooltip="Open website"]')) ||
            (await newPage.$('a[data-tooltip="Open menu link"]'));
          let website = websiteElement
            ? await newPage.evaluate(
                (element) => element.getAttribute("href"),
                websiteElement
              )
            : "";
          website = `"${website}"`;
          const phoneElement = await newPage.$(
            'button[data-tooltip="Copy phone number"]'
          );
          let phone = phoneElement
            ? await newPage.evaluate(
                (element) => element.textContent,
                phoneElement
              )
            : "";
          phone = `"${phone}"`;
          url = `"${url}"`;
          await newPage.close();
          function cleanField(field) {
            return field?.replace(
              /[^a-zA-Z0-9\s!@#$%^&*()-_+=|{}[\]:;"'<>,.?/\\]/g,
              ""
            );
          }
          return {
            name: cleanField(name),
            rating: cleanField(rating),
            reviews: cleanField(reviews),
            category: cleanField(category),
            address: cleanField(address),
            website: cleanField(website),
            phone: cleanField(phone),
            url: cleanField(url),
          };
        })
      );
      results.push(batchResults);
      // Send each batch of data to the client via WebSocket
      ws.send(JSON.stringify(batchResults));
    }
    await page.waitForTimeout(5000);
    let endOfList = false;
    while (!endOfList) {
      await scrollable.evaluate((node) => node.scrollBy(0, 500));
      endOfList = await page.evaluate(() =>
        document.body.innerText.includes("You've reached the end of the list")
      );
      await page.waitForTimeout(1000);
    }
    const urls = await page.$$eval("a", (links) =>
      links
        .map((link) => link.href)
        .filter((href) => href.startsWith("https://www.google.com/maps/place/"))
    );
    const filteredUrls = urls.filter((url) => !initialUrls.includes(url));

    for (let i = 0; i < filteredUrls.length; i += batchSize) {
      const batchUrls = filteredUrls.slice(i, i + batchSize);
      const batchResults = await Promise.all(
        batchUrls.map(async (url) => {
          const newPage = await context.newPage();
          await newPage.goto(url);
          await newPage.waitForSelector('[jstcache="3"]');
          const nameElement = await newPage.$(
            "xpath=/html/body/div[2]/div[3]/div[8]/div[9]/div/div/div[1]/div[2]/div/div[1]/div/div/div[2]/div/div[1]/div[1]/h1"
          );
          let name = nameElement
            ? await newPage.evaluate(
                (element) => element.textContent,
                nameElement
              )
            : "";
          name = `"${name}"`;
          const ratingElement = await newPage.$(
            "xpath=/html/body/div[2]/div[3]/div[8]/div[9]/div/div/div[1]/div[2]/div/div[1]/div/div/div[2]/div/div[1]/div[2]/div/div[1]/div[2]/span[1]/span[1]"
          );
          let rating = ratingElement
            ? await newPage.evaluate(
                (element) => element.textContent,
                ratingElement
              )
            : "";
          rating = `"${rating}"`;
          const reviewsElement = await newPage.$(
            "xpath=/html/body/div[2]/div[3]/div[8]/div[9]/div/div/div[1]/div[2]/div/div[1]/div/div/div[2]/div/div[1]/div[2]/div/div[1]/div[2]/span[2]/span/span"
          );
          let reviews = reviewsElement
            ? await newPage.evaluate(
                (element) => element.textContent,
                reviewsElement
              )
            : "";
          reviews = reviews.replace(/\(|\)/g, "");
          reviews = `"${reviews}"`;
          const categoryElement = await newPage.$(
            "xpath=/html/body/div[2]/div[3]/div[8]/div[9]/div/div/div[1]/div[2]/div/div[1]/div/div/div[2]/div/div[1]/div[2]/div/div[2]/span/span/button"
          );
          let category = categoryElement
            ? await newPage.evaluate(
                (element) => element.textContent,
                categoryElement
              )
            : "";
          category = `"${category}"`;
          const addressElement = await newPage.$(
            'button[data-tooltip="Copy address"]'
          );
          let address = addressElement
            ? await newPage.evaluate(
                (element) => element.textContent,
                addressElement
              )
            : "";
          address = `"${address}"`;
          const websiteElement =
            (await newPage.$('a[data-tooltip="Open website"]')) ||
            (await newPage.$('a[data-tooltip="Open menu link"]'));
          let website = websiteElement
            ? await newPage.evaluate(
                (element) => element.getAttribute("href"),
                websiteElement
              )
            : "";
          website = `"${website}"`;
          const phoneElement = await newPage.$(
            'button[data-tooltip="Copy phone number"]'
          );
          let phone = phoneElement
            ? await newPage.evaluate(
                (element) => element.textContent,
                phoneElement
              )
            : "";
          phone = `"${phone}"`;
          url = `"${url}"`;
          await newPage.close();
          function cleanField(field) {
            return field?.replace(
              /[^a-zA-Z0-9\s!@#$%^&*()-_+=|{}[\]:;"'<>,.?/\\]/g,
              ""
            );
          }
          return {
            name: cleanField(name),
            rating: cleanField(rating),
            reviews: cleanField(reviews),
            category: cleanField(category),
            address: cleanField(address),
            website: cleanField(website),
            phone: cleanField(phone),
            url: cleanField(url),
          };
        })
      );
      results.push(batchResults);
      // Send each batch of data to the client via WebSocket
      ws.send(JSON.stringify(batchResults));
    }

    const csvHeader =
      "Name,Rating,Reviews,Category,Address,Website,Phone,Url\n";
    const csvRows = results
      .map(
        (r) =>
          `${r.name},${r.rating},${r.reviews},${r.category},${r.address},${r.website},${r.phone},${r.url}`
      )
      .join("\n");
    // await browser.close();
    console.timeEnd("Execution Time");
    ws.close();
    let final = csvHeader + csvRows;
    return { final, results };
  });
};

export default scraperWs;
