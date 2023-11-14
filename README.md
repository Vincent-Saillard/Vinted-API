# VINTED copy - Back-end

Project done while on BootCamp. Follow this link to see online front-end ==> https://vinted-reactjs.netlify.app/

## Description

This project contains all Routes for front-end project (excepted payment Route) but is not connected to it at the moment.

- index
  - User Route
    - Create User (signup) POST
      https://site--vinted-api--kyjktnxc458w.code.run/user/signup
    - Connect User (login) POST
      https://site--vinted-api--kyjktnxc458w.code.run/user/login
  - Offer Route
    - Create Offer (upload) POST
      https://site--vinted-api--kyjktnxc458w.code.run/offers
    - Modify Offer PUT
      https://site--vinted-api--kyjktnxc458w.code.run/offers/652fe7e6fd10b3d90719c648
    - Delete Offer by id DELETE
      https://site--vinted-api--kyjktnxc458w.code.run/offers/652fe7e6fd10b3d90719c648
    - Get offers with sorting options GET
      https://site--vinted-api--kyjktnxc458w.code.run/offers?quantityByPage=15&sort=price-desc
    - Get Offer by id GET
      https://site--vinted-api--kyjktnxc458w.code.run/offers/6531152c17719472b475c899

It is hosted on NorthFlank and tested before, using Postman.
Pictures are loaded on Cloudinary and DataBase is on MongoDB

## Getting Started

use npm to install needed dependencies and npx nodemon to test

### Dependencies

- Express
- Cors
- Mongoose
- dotenv
- crypto-js
- uid2
- cloudinary
- express-filupload
- nodemon

## Author

Vincent Saillard

- https://www.linkedin.com/in/vincent-saillard-096255a7/
- https://github.com/Vincent-Saillard

## Acknowledgments

[Northflank](https://pbs.twimg.com/profile_images/1260194537001103361/grioVrbA_400x400.png)

[Postman](https://logowik.com/content/uploads/images/postman-api-platform6643.logowik.com.webp)

[MongoDB](https://infinapps.com/wp-content/uploads/2018/10/mongodb-logo.png)

[Cloudinary](https://market-assets.strapi.io/logos/recQCFBl61THeLN0w-logo)
