export const queryBuilder = async ({
    model,
    query,

    searchableFields = [],
    filterableFields = [],
    sortableFields = [],

    numberFields = [],
    booleanFields = [],

    defaultSort = { createdAt: "desc" },

    where = {},
    include,
    select,
}) => {

    // Pagination
    const page = parseInt(query.page) || 1;
    const limit = Math.min(parseInt(query.limit) || 24, 100);
    const skip = (page - 1) * limit;

    // Search
    const search = query.search;

    // Sorting
    const sortBy = sortableFields.includes(query.sortBy)
        ? query.sortBy
        : Object.keys(defaultSort)[0];

    const order =
        query.order === "asc" || query.order === "desc"
            ? query.order
            : Object.values(defaultSort)[0];

    // Clone existing where
    const filters = { ...where };

    // Search
    if (search && searchableFields.length) {
        filters.OR = searchableFields.map((field) => ({
            [field]: {
                contains: search,
                mode: "insensitive",
            },
        }));
    }

    // Filters
    filterableFields.forEach((field) => {

        if (query[field] === undefined) return;

        let value = query[field];

        if (numberFields.includes(field)) {
            value = Number(value);

            if (isNaN(value)) return;
        }

        if (booleanFields.includes(field)) {
            value = value === "true";
        }

        filters[field] = value;
    });

    const [data, total] = await Promise.all([

        model.findMany({
            where: filters,
            include,
            select,
            skip,
            take: limit,
            orderBy: {
                [sortBy]: order,
            },
        }),

        model.count({
            where: filters,
        }),
    ]);

    return {
        data,
        meta: {
            total,
            page,
            limit,
            totalPages: Math.ceil(total / limit),
        },
    };
};