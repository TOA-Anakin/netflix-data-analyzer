import csvData from "./data/input/netflix_titles.csv";

// Initializing DataFrame variable
var df = [];

// Plot style
var headerStyle = {
    align: "center",
    fill: { color: ["gray"] },
    font: { family: "Arial", size: 15, color: "white" },
    columnwidth: 200
};
var cellStyle = {
    align: ["center"],
    line: { color: "black", width: 1 },
};

/**
 * Display the table with the data
 */
function showData() {
    df.plot("data").table({
        config: {
            tableHeaderStyle: headerStyle,
            tableCellStyle: cellStyle,
        },
        layout: {
            title: "Table displaying the Netflix dataset",
        },
    });
}

/**
 * Display the null values in the table
 */
function showNull() {
    let df_null = df.isNa().sum({ axis: 0 });
    const div = document.getElementById("null_table");

    div.innerHTML = String(df_null);

    df_null.plot("null").pie({
        layout: {
            title: "Pie Chart displaying NaN values for each column",
        },
    });
}

/**
 * Handle the null values
 */
function handleNull() {
    let df_country = df["country"].valueCounts().sortValues({ ascending: false });
    let values = [df_country["index"][0], "Unknown", "Unknown"];
    df = df.fillNa(values, { columns: ["country", "cast", "director"] });
    df.dropNa({ axis: 1, inplace: true });

    let df_null = df.isNa().sum({ axis: 0 });
    const div = document.getElementById("no_null");
    div.innerHTML = String(df_null);
}

/**
 * Add column "year_added" to the DataFrame
 */
function addColumn() {
    df.addColumn("year_added", df["date_added"].dt.year(), { inplace: true });

    df.plot("content_year").table({
        config: {
            tableHeaderStyle: headerStyle,
            tableCellStyle: cellStyle,
        },
        layout: {
            title: "Added 'year_added' column",
        },
    });
}

/**
 * Plot the content type
 */
function plotContentType() {
    df["type"].valueCounts().plot("content_type_bar_plot").pie({
        layout: {
            title: "Plot of Seasons and Movies",
        },
    });
}

/**
 * Plot the growth in content over the years
 */
function plotContentGrowth() {
    // Grouping data
    let grp = df.groupby(["year_added", "type"]);
    let grp_count = grp.col(["type"]).count();

    // Separating movies and TV shows data
    let movie = grp_count.query(grp_count["type"].str.includes("Movie"));
    let tv = grp_count.query(grp_count["type"].str.includes("TV Show"));

    // Outer join both movies and TV shows data to get all years as index
    let merge_df = dfd.merge({ left: movie, right: tv, on: ["year_added"], how: "outer" });
    merge_df.setIndex({ column: "year_added", inplace: true });
    merge_df = merge_df.rename({ type_count: "Movies", type_count_1: "TV Shows" });
    merge_df = merge_df.fillNa(0, { columns: ["TV Shows"] });

    merge_df.plot("line_chart").line({
        config: {
            columns: ["Movies", "TV Shows"]
        },
        layout: {
            title: "Line chart showing the growth in content over the years",
            xaxis: {
                title: "Years"
            },
            yaxis: {
                title: "Count of the content"
            }
        },
    });
}

/**
 * Display top 10 oldest movies and TV shows
 */
function showTop10Oldest() {
    df.resetIndex({ inplace: true });
    let movies = df.query(df["type"].str.includes("Movie"));
    let tv = df.query(df["type"].str.includes("TV Show"));

    movies.sortValues("release_year", { inplace: true });
    movies.resetIndex({ inplace: true });

    tv.sortValues("release_year", { inplace: true });
    tv.resetIndex({ inplace: true });

    let div1 = document.getElementById('top_movies');
    div1.innerHTML = String(movies.loc({ columns: ['title', 'release_year'] }));

    let div2 = document.getElementById('top_tv_shows');
    div2.innerHTML = String(tv.loc({ columns: ['title', 'release_year'] }));
}

/**
 * Plot the duration of movies and TV shows
 */
function plotDurations() {
    // Movie duration
    df.resetIndex({ inplace: true });
    let movies = df.query(df["type"].str.includes("Movie"));
    movies.resetIndex({ inplace: true });
    let movie_duration = movies["duration"].str.replace(" min", "");

    // TV Show Seasons 
    let seasons = df.query(df["type"].str.includes("TV Show"));
    seasons.resetIndex({ inplace: true });
    let seasons_duration = seasons["duration"].valueCounts();

    movie_duration.plot("movie_duration").hist({

        layout: {
            title: "Movies duration histogram",
            xaxis: {
                title: 'Movies running time'
            },
            yaxis: {
                title: 'Count of the movies'
            }
        },
    });

    seasons_duration.plot("tv_duration").bar({
        layout: {
            title: "TV shows length bar chart",
            xaxis: {
                title: 'TV shows length'
            },
            yaxis: {
                title: 'Count of the TV shows'
            }
        },
    });
}

/**
 * Plot the ratings of movies and TV shows
 */
function plotRatings() {
    // Grouping data 
    let grp = df.groupby(["rating", "type"]);
    let grp_count = grp.col(["type"]).count();
    let movie = grp_count.query(grp_count["type"].str.includes("Movie"));
    let tv = grp_count.query(grp_count["type"].str.includes("TV Show"));

    // Merging the movies and TV shows data
    let merge_df = dfd.merge({ left: movie, right: tv, on: ["rating"], how: "outer" });
    merge_df.setIndex({ column: "rating", inplace: true });
    merge_df = merge_df.rename({ type_count: "Movies", type_count_1: "TV Shows" });
    merge_df = merge_df.fillNa(0, { columns: ["TV Shows"] });

    merge_df.plot("plot_ratings").bar({
        config: {
            columns: ["Movies", "TV Shows"]
        },
        layout: {
            title: "Count of movies and TV shows ratings",
            xaxis: {
                title: 'Ratings'
            },
            yaxis: {
                title: 'Count of ratings'
            }
        }
    });
}

dfd.readCSV(csvData)
    .then(data => {
        df = data;

        showData();
        showNull();
        handleNull();
        addColumn();
        plotContentType();
        plotContentGrowth();
        showTop10Oldest();
        plotDurations();
        plotRatings();
    }).catch(err => {
        console.log(err);
    });