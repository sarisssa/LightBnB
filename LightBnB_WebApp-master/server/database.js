const properties = require('./json/properties.json');
const users = require('./json/users.json');

const { Pool } = require('pg');

const pool = new Pool({
  user: 'vagrant',
  password: '123',
  host: 'localhost',
  database: 'lightbnb'
});

/// Users

/**
 * Get a single user from the database given their email.
 * @param {String} email The email of the user.
 * @return {Promise<{}>} A promise to the user.
 */
const getUserWithEmail = function (email) {
  return pool
    .query(`SELECT * FROM users WHERE email = $1`, [email])
    .then((res) => res.rows[0])
    .catch((err) => {
      console.log(err);
    });
}
exports.getUserWithEmail = getUserWithEmail;

const getUserWithId = function (id) {
  return pool.query(`SELECT * FROM users WHERE id = $1;`, [id])
    .then(res => res.rows[0])
    .catch((err) => {
      console.log(err);
    });
}
exports.getUserWithId = getUserWithId;

const addUser = function (user) {
  const values = [user.name, user.email, user.password];

  const query = `INSERT INTO users (name, email, password) VALUES ($1, $2, $3) RETURNING *;`;

  return pool.query(query, values)
    .then(res => res.rows[0])
    .catch(err => {
      console.log(err)
    });
}
exports.addUser = addUser;

const getAllReservations = function (guest_id, limit = 10) {
  const values = [guest_id, limit];

  const query = `SELECT properties.*, reservations.*, avg(rating) as average_rating
  FROM reservations
  JOIN properties ON reservations.property_id = properties.id
  JOIN property_reviews ON properties.id = property_reviews.property_id 
  WHERE reservations.guest_id = $1
  AND reservations.end_date < now()::date
  GROUP BY properties.id, reservations.id
  ORDER BY reservations.start_date
  LIMIT $2;`;

  return pool.query(query, values)
    .then(res => res.rows)
    .catch(err => {
      console.log(err)
    })
}
exports.getAllReservations = getAllReservations;

const getAllProperties = function (options, limit = 10) {
  
  let values = [];

  let queryString = `
  SELECT properties.*, avg(property_reviews.rating) as average_rating
  FROM properties
  JOIN property_reviews ON properties.id = property_reviews.property_id
  `;
  
  if (options.city) {
   values.push(`%${options.city}%`);
   queryString += `WHERE city LIKE $${values.length} `;
  }
  if (options.owner_id) {
    values.push(options.owner_id);
    queryString += `AND owner_id = $${values.length}`;
  }
  if(options.minimum_price_per_night){
    values.push(options.minimum_price_per_night);
    queryString += `AND cost_per_night >= $${values.length} * 100 `;
  }
  if(options.maximum_price_per_night){
    values.push(options.maximum_price_per_night);
    queryString += `AND cost_per_night <= $${values.length} * 100 `;
  }
    
  queryString += `
  GROUP BY properties.id `; 

  if(options.minimum_rating){
    values.push(options.minimum_rating);
    queryString += `HAVING avg(property_reviews.rating) >= $${values.length} `;
  }
  
  values.push(limit);
  queryString += `
  ORDER BY cost_per_night
  LIMIT $${values.length};
  `;

  // 5
  console.log(queryString, values);
  
  return pool
    .query(queryString,values)
    .then(result => result.rows)
    .catch(err => console.log(err.message));
};

exports.getAllProperties = getAllProperties;

const addProperty = function (property) {
  const queryString = `
  INSERT INTO properties (owner_id, title, description, thumbnail_photo_url, cover_photo_url, cost_per_night, parking_spaces, number_of_bathrooms, number_of_bedrooms, country, street, city, province, post_code)
  VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
  RETURNING *;`
  const values = [property.owner_id, property.title, property.description, property.thumbnail_photo_url, property.cover_photo_url, property.cost_per_night, property.parking_spaces, property.number_of_bathrooms, property.number_of_bedrooms, property.country, property.street, property.city, property.province, property.post_code]

  return pool.query(queryString, values)
    .then(res => res.rows[0])
    .catch(err => console.log(err)
  );
}
exports.addProperty = addProperty;
