import { Query } from "mongoose";

class APIFeatures<T, U> {
  public query: Query<T[], T, U>;
  public queryString: any;

  constructor(query: Query<T[], T, U>, queryString: any) {
    this.query = query;
    this.queryString = queryString;
  }

  // Filtering
  filter(): this {
    const queryObj = { ...this.queryString };
    const excludedFields = ["page", "sort", "limit", "fields"];
    excludedFields.forEach((el) => delete queryObj[el]);

    // NO-SQL SANITATION LAYER: Remove keys beginning with "$" to prevent injection
    Object.keys(queryObj).forEach((key) => {
      if (key.startsWith("$")) delete queryObj[key];
    });

    // Advanced filtering (gte, gt, lte, lt)
    let queryStr = JSON.stringify(queryObj);
    queryStr = queryStr.replace(/\b(gte|gt|lte|lt)\b/g, (match) => `$${match}`);

    this.query = this.query.find(JSON.parse(queryStr));

    return this;
  }

  // Sorting
  sort(): this {
    if (this.queryString.sort && typeof this.queryString.sort === "string") {
      const sortBy = this.queryString.sort.split(",").join(" ");
      this.query = this.query.sort(sortBy);
    } else {
      // Clean fallback if createdAt field selection is suppressed elsewhere
      this.query = this.query.sort("-id");
    }
    return this;
  }

  // Field Limiting
  limitFields(): this {
    if (
      this.queryString.fields &&
      typeof this.queryString.fields === "string"
    ) {
      const fields = this.queryString.fields.split(",").join(" ");
      this.query = this.query.select(fields);
    } else {
      this.query = this.query.select("-__v");
    }

    return this;
  }

  // Pagination
  paginate(): this {
    const page = Number(this.queryString.page) || 1;
    const limit = Number(this.queryString.limit) || 100;
    const skip = (page - 1) * limit;
    this.query = this.query.skip(skip).limit(limit);

    return this;
  }
}

export default APIFeatures;
