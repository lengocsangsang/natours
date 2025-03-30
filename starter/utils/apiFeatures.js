class APIFeatures {
  constructor(query, queryString) {
    this.query = query;
    this.queryString = queryString;
  }

  filter() {
    // BUILD QUERY
    // 1A) Simple filtering
    //SYNTAX IN POSTMAN: 127.0.0.1:8000/api/v1/tours?price=2997
    //QUERY SYNTAX RECEIVED:  { price: '2997'}
    //SYNTAX IN MONGOOSE: Tour.find({ price: '2997')
    const queryObj = { ...this.queryString };
    const excludedFields = ['page', 'sort', 'limit', 'fields'];
    excludedFields.forEach((el) => delete queryObj[el]);

    // 1B)Advanced filtering
    //SYNTAX IN POSTMAN: 127.0.0.1:8000/api/v1/tours?price=2997&ratingsAverage[gte]=4.9
    //QUERY SYNTAX RECEIVED:{ price: '2997', ratingsAverage: { gte: '4.9' } }
    //SYNTAX IN MONGOOSE: Tour.find({ price: '2997', ratingsAverage: { '$gte': '4.9' } })
    let queryStr = JSON.stringify(queryObj);
    queryStr = queryStr.replace(/\b(gte|gt|lte|lt)\b/g, (match) => `$${match}`);
    this.query = this.query.find(JSON.parse(queryStr));
    //  query was passed to APIFeatures constructor as Tour.find();
    return this;
  }

  //2)SORTING
  // SYNTAX IN POSTMAN: 127.0.0.1:8000/api/v1/tours?sort=-price,-ratingsAverage
  // SORT QUERY RECEIVED: -price,-ratingsAverage
  // SYNTAX IN MONGOOSE: query.sort("price ratingsAverage")
  sort() {
    if (this.queryString.sort) {
      console.log(
        '🎈FROM apiFEATURE. THIS.QUERYSTRING.SORT:',
        this.queryString.sort,
      );
      // IF WE MENTION "SORT" 2 TIMES IN OUR POSTMAN REQUEST, like {{URL}}api/v1/tours?sort=duration&sort=price
      // THE this.queryString.sort WILL BE AN ARRAY AS RESULT OF ABOVE CONSOLE.LOG.
      // THIS IS A RISK CALLED HTTP PARAMETER POLLUTION, WHICH CAN BE ABUSED BY ATTACKER.
      // WE CAN SOLVE THIS BY hpp. When using hpp, ONLY the 2nd "sort" will be implemented.
      const sortBy = this.queryString.sort.split(',').join(' ');
      this.query = this.query.sort(sortBy);
    } else {
      this.query = this.query.sort('-createdAt');
    }
    return this;
  }

  // 3)Field limiting
  // SYNTAX IN POSTMAN: 127.0.0.1:8000/api/v1/tours?fields=name,duration,difficulty,price
  // FIELDS QUERY RECEIVED: name,duration,difficulty,price
  // SYNTAX IN MONGOOSE: query.select(name duration difficulty price)
  limitFields() {
    if (this.queryString.fields) {
      const fields = this.queryString.fields.split(',').join(' ');
      this.query = this.query.select(fields);
    } else {
      this.query = this.query.select('-__v');
    }
    return this;
  }

  //4)PAGINATION
  paginate() {
    const page = this.queryString.page * 1 || 1;
    const limit = this.queryString.limit * 1 || 100;
    const skip = (page - 1) * limit;
    //page=3&limit=10, 1-10, page1, 11-20, page 2, 21-30 page
    this.query = this.query.skip(skip).limit(limit);
    return this;
  }
}

module.exports = APIFeatures;
