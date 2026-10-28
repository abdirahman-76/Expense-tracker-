"use strict";

const balanceDisplay = document.querySelector("#balance");
const incomeDisplay = document.querySelector("#income");
const expensesDisplay = document.querySelector("#expenses");

const transactionForm = document.querySelector("#transactionForm");
const descriptionInput = document.querySelector("#description");
const amountInput = document.querySelector("#amount");
const typeInput = document.querySelector("#type");
const categoryInput = document.querySelector("#category");
const transactionDateInput = document.querySelector("#transactionDate");

const submitButton = document.querySelector("#submitButton");
const cancelEditButton = document.querySelector("#cancelEditButton");
const formHeading = document.querySelector("#formHeading");
const formMessage = document.querySelector("#formMessage");

const transactionList = document.querySelector("#transactionList");
const transactionCount = document.querySelector("#transactionCount");
const transactionFilter = document.querySelector("#transactionFilter");
const categoryFilter = document.querySelector("#categoryFilter");
const searchInput = document.querySelector("#searchInput");
const exportButton = document.querySelector("#exportButton");

const reportMonthInput = document.querySelector("#reportMonth");
const monthlyIncomeDisplay = document.querySelector("#monthlyIncome");
const monthlyExpensesDisplay = document.querySelector("#monthlyExpenses");
const monthlyBalanceDisplay = document.querySelector("#monthlyBalance");

const comparisonChart = document.querySelector("#comparisonChart");
const categoryChart = document.querySelector("#categoryChart");

const STORAGE_KEY = "expenseTransactions";

const incomeCategories = [
    { value: "salary", text: "Salary" },
    { value: "business", text: "Business" },
    { value: "gift", text: "Gift" },
    { value: "other", text: "Other" }
];

const expenseCategories = [
    { value: "food", text: "Food" },
    { value: "transport", text: "Transport" },
    { value: "shopping", text: "Shopping" },
    { value: "bills", text: "Bills" },
    { value: "other", text: "Other" }
];

let editingTransactionId = null;
let transactions = loadTransactions();

function createId() {
    if (
        window.crypto &&
        typeof window.crypto.randomUUID === "function"
    ) {
        return window.crypto.randomUUID();
    }

    return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function getTodayDate() {
    const today = new Date();

    const year = today.getFullYear();

    const month = String(today.getMonth() + 1).padStart(2, "0");

    const day = String(today.getDate()).padStart(2, "0");

    return `${year}-${month}-${day}`;
}

function formatMoney(amount) {
    return `$${amount.toFixed(2)}`;
}

function getValidAmount(transaction) {
    const amount = Number(transaction.amount);

    if (!Number.isFinite(amount) || amount <= 0) {
        return 0;
    }

    return amount;
}
function getCategoryLabel(categoryValue) {
    const allCategories = [
        ...incomeCategories,
        ...expenseCategories
    ];

    const foundCategory = allCategories.find(function (category) {
        return category.value === categoryValue;
    });

    return foundCategory ? foundCategory.text : "Other";
}

function showMessage(message, type = "") {
    formMessage.textContent = message;

    formMessage.className = "form-message";

    if (type) {
        formMessage.classList.add(type);
    }
}

function loadTransactions() {
    const savedText = localStorage.getItem(STORAGE_KEY);

    if (!savedText) {
        return [];
    }

    try {
        const parsedTransactions = JSON.parse(savedText);

        if (!Array.isArray(parsedTransactions)) {
            return [];
        }

        return parsedTransactions
            .filter(function (item) {
                return item && typeof item === "object";
            })
            .map(function (item) {
                const amount = Number(item.amount);

                return {
                    id:
                        typeof item.id === "string" && item.id
                            ? item.id
                            : createId(),

                    description: String(
                        item.description || "Untitled transaction"
                    ),

                    amount: Number.isFinite(amount) ? amount : 0,

                    type:
                        item.type === "income"
                            ? "income"
                            : "expense",

                    category: String(item.category || "other"),

                    date: /^\d{4}-\d{2}-\d{2}$/.test(
                        String(item.date || "")
                    )
                        ? String(item.date)
                        : ""
                };
            });

    } catch (error) {
        console.error(
            "Could not read saved transactions:",
            error
        );

        return [];
    }
}


function saveTransactions() {
    try {
        localStorage.setItem(
            STORAGE_KEY,
            JSON.stringify(transactions)
        );

    } catch (error) {
        console.error(
            "Could not save transactions:",
            error
        );

        showMessage(
            "Your browser could not save the data. Export a CSV backup.",
            "error"
        );
    }
}

function updateCategoryOptions() {
    const choices =
        typeInput.value === "income"
            ? incomeCategories
            : expenseCategories;

    const previousValue = categoryInput.value;

    categoryInput.replaceChildren();

    choices.forEach(function (category) {
        const option = document.createElement("option");

        option.value = category.value;

        option.textContent = category.text;

        categoryInput.appendChild(option);
    });

    const previousStillExists = choices.some(function (category) {
        return category.value === previousValue;
    });

    if (previousStillExists) {
        categoryInput.value = previousValue;
    }
}


function updateCategoryFilterOptions() {
    const previousValue = categoryFilter.value;

    const categories = [
        ...new Set(
            transactions.map(function (transaction) {
                return transaction.category || "other";
            })
        )
    ].sort();

    categoryFilter.replaceChildren();

    const allOption = document.createElement("option");

    allOption.value = "all";

    allOption.textContent = "All categories";

    categoryFilter.appendChild(allOption);

    categories.forEach(function (categoryValue) {
        const option = document.createElement("option");

        option.value = categoryValue;

        option.textContent = getCategoryLabel(categoryValue);

        categoryFilter.appendChild(option);
    });

    if (categories.includes(previousValue)) {
        categoryFilter.value = previousValue;
    } else {
        categoryFilter.value = "all";
    }
}

function updateSummary() {
    let totalIncome = 0;

    let totalExpenses = 0;

    transactions.forEach(function (transaction) {
        const amount = getValidAmount(transaction);

        if (transaction.type === "income") {
            totalIncome += amount;

        } else {
            totalExpenses += amount;
        }
    });

    const balance = totalIncome - totalExpenses;

    balanceDisplay.textContent = formatMoney(balance);

    incomeDisplay.textContent = formatMoney(totalIncome);

    expensesDisplay.textContent = formatMoney(totalExpenses);
}

function getSelectedMonthTransactions() {
    const selectedMonth = reportMonthInput.value;

    return transactions.filter(function (transaction) {
        if (!transaction.date) {
            return false;
        }

        const transactionMonth = transaction.date.slice(0, 7);

        return transactionMonth === selectedMonth;
    });
}

function updateMonthlyReport() {
    const monthTransactions = getSelectedMonthTransactions();

    let monthlyIncome = 0;

    let monthlyExpenses = 0;

    monthTransactions.forEach(function (transaction) {
        const amount = getValidAmount(transaction);

        if (transaction.type === "income") {
            monthlyIncome += amount;

        } else {
            monthlyExpenses += amount;
        }
    });

    const monthlyBalance = monthlyIncome - monthlyExpenses;

    monthlyIncomeDisplay.textContent =
        formatMoney(monthlyIncome);

    monthlyExpensesDisplay.textContent =
        formatMoney(monthlyExpenses);

    monthlyBalanceDisplay.textContent =
        formatMoney(monthlyBalance);
    updateComparisonChart(monthlyIncome, monthlyExpenses);

    updateCategoryChart(monthTransactions);
}

function updateComparisonChart(monthlyIncome, monthlyExpenses) {
    comparisonChart.replaceChildren();

    const largestValue = Math.max(
        monthlyIncome,
        monthlyExpenses,
        1
    );

    const chartRows = [
        {
            label: "Income",
            amount: monthlyIncome,
            className: "income-fill"
        },
        {
            label: "Expenses",
            amount: monthlyExpenses,
            className: "expense-fill"
        }
    ];

    chartRows.forEach(function (row) {
        const rowElement = document.createElement("div");

        rowElement.className = "bar-row";

        const label = document.createElement("span");

        label.className = "bar-label";

        label.textContent = row.label;

        const track = document.createElement("div");

        track.className = "bar-track";



        const fill = document.createElement("div");

        fill.className = `bar-fill ${row.className}`;

        fill.style.width =
            `${(row.amount / largestValue) * 100}%`;

        track.appendChild(fill);

        const value = document.createElement("strong");

        value.className = "bar-value";

        value.textContent = formatMoney(row.amount);
        rowElement.append(label, track, value);

        comparisonChart.appendChild(rowElement);
    });
}

function updateCategoryChart(monthTransactions) {
    categoryChart.replaceChildren();

    const categoryTotals = {};
    monthTransactions.forEach(function (transaction) {
        if (transaction.type !== "expense") {
            return;
        }

        const category = transaction.category || "other";

        const amount = getValidAmount(transaction);

        categoryTotals[category] =
            (categoryTotals[category] || 0) + amount;
    });

    const categoryEntries = Object.entries(categoryTotals)
        .filter(function (entry) {
            return entry[1] > 0;
        })
        .sort(function (a, b) {
            return b[1] - a[1];
        });

    if (categoryEntries.length === 0) {
        const emptyMessage = document.createElement("p");

        emptyMessage.className = "empty-chart";

        emptyMessage.textContent =
            "No expenses recorded for this month yet.";

        categoryChart.appendChild(emptyMessage);

        return;
    }


    const largestTotal = categoryEntries[0][1];

    categoryEntries.forEach(function (entry) {
        const category = entry[0];

        const amount = entry[1];

        const row = document.createElement("div");

        row.className = "category-row";
        const top = document.createElement("div");

        top.className = "category-row-top";

        const label = document.createElement("span");

        label.textContent = getCategoryLabel(category);

        const value = document.createElement("strong");

        value.textContent = formatMoney(amount);

        top.append(label, value);

        const track = document.createElement("div");

        track.className = "category-track";
        const fill = document.createElement("div");

        fill.className = "category-fill";

        fill.style.width =
            `${(amount / largestTotal) * 100}%`;

        track.appendChild(fill);


        row.append(top, track);

        categoryChart.appendChild(row);
    });
}

function displayTransactions() {
    transactionList.replaceChildren();

    const selectedType = transactionFilter.value;

    const selectedCategory = categoryFilter.value;

    const searchText = searchInput.value.trim().toLowerCase();

    const sortedTransactions = [...transactions];

    sortedTransactions.sort(function (a, b) {
        return (b.date || "").localeCompare(a.date || "");
    });

    const visibleTransactions = sortedTransactions.filter(
        function (transaction) {
            const typeMatches =
                selectedType === "all" ||
                transaction.type === selectedType;

            const categoryMatches =
                selectedCategory === "all" ||
                (transaction.category || "other") === selectedCategory;

            const descriptionMatches =
                transaction.description
                    .toLowerCase()
                    .includes(searchText);

            return (
                typeMatches &&
                categoryMatches &&
                descriptionMatches
            );
        }
    );

    transactionCount.textContent =
        `${visibleTransactions.length} ${visibleTransactions.length === 1
            ? "transaction"
            : "transactions"
        }`;

    if (visibleTransactions.length === 0) {
        const emptyMessage = document.createElement("li");

        emptyMessage.className = "empty-list";

        emptyMessage.textContent =
            transactions.length === 0
                ? "No transactions yet. Add your first transaction above."
                : "No transactions match these filters.";

        transactionList.appendChild(emptyMessage);

        return;
    }

    visibleTransactions.forEach(function (transaction) {
        const listItem = document.createElement("li");

        listItem.className = "transaction-item";



        const main = document.createElement("div");

        main.className = "transaction-main";

        const description = document.createElement("p");

        description.className = "transaction-description";

        description.textContent = transaction.description;

        const meta = document.createElement("p");

        meta.className = "transaction-meta";

        meta.textContent =
            `${getCategoryLabel(transaction.category)} · ` +
            `${transaction.date || "Date not available"} · ` +
            `${transaction.type === "income" ? "Income" : "Expense"}`;

        main.append(description, meta);

        const amount = document.createElement("strong");

        amount.className =
            `transaction-amount ${transaction.type === "income"
                ? "income-text"
                : "expense-text"
            }`;

        const sign = transaction.type === "income" ? "+" : "−";

        amount.textContent =
            `${sign}${formatMoney(getValidAmount(transaction))}`;



        const actions = document.createElement("div");

        actions.className = "transaction-actions";


        const editButton = document.createElement("button");

        editButton.type = "button";

        editButton.className = "button button-quiet button-small";

        editButton.textContent = "Edit";

        editButton.addEventListener("click", function () {
            startEditing(transaction);
        });


        const deleteButton = document.createElement("button");

        deleteButton.type = "button";

        deleteButton.className = "button button-danger button-small";

        deleteButton.textContent = "Delete";

        deleteButton.addEventListener("click", function () {
            deleteTransaction(transaction.id);
        });


        actions.append(editButton, deleteButton);

        listItem.append(main, amount, actions);

        transactionList.appendChild(listItem);
    });
}

function startEditing(transaction) {
    editingTransactionId = transaction.id;

    descriptionInput.value = transaction.description;

    amountInput.value = transaction.amount;

    typeInput.value = transaction.type;

    updateCategoryOptions();

    categoryInput.value = transaction.category || "other";

    transactionDateInput.value =
        transaction.date || getTodayDate();

    submitButton.textContent = "Save changes";

    cancelEditButton.classList.remove("hidden");

    formHeading.textContent = "Edit transaction";

    showMessage(
        "Editing this transaction. Save changes or cancel."
    );

    descriptionInput.focus();

    transactionForm.scrollIntoView({
        behavior: "smooth",
        block: "start"
    });
}


function resetTransactionForm() {
    transactionForm.reset();

    editingTransactionId = null;

    submitButton.textContent = "Add transaction";

    cancelEditButton.classList.add("hidden");

    formHeading.textContent = "Add a transaction";

    transactionDateInput.value = getTodayDate();

    updateCategoryOptions();
}

function deleteTransaction(id) {
    const transaction = transactions.find(function (item) {
        return item.id === id;
    });

    if (!transaction) {
        return;
    }

    const confirmed = window.confirm(
        `Delete "${transaction.description}"? This cannot be undone.`
    );

    if (!confirmed) {
        return;
    }

    transactions = transactions.filter(function (item) {
        return item.id !== id;
    });

    if (editingTransactionId === id) {
        resetTransactionForm();
    }



    saveTransactions();

    updateCategoryFilterOptions();

    updateSummary();

    updateMonthlyReport();

    displayTransactions();

    showMessage("Transaction deleted.", "success");
}


transactionForm.addEventListener("submit", function (event) {
    event.preventDefault();



    const description = descriptionInput.value.trim();

    const amount = Number(amountInput.value);

    const type = typeInput.value;

    const category = categoryInput.value;

    const date = transactionDateInput.value;


    if (!description) {
        showMessage(
            "Please enter a description.",
            "error"
        );

        descriptionInput.focus();

        return;
    }



    if (!Number.isFinite(amount) || amount <= 0) {
        showMessage(
            "Enter an amount greater than zero.",
            "error"
        );

        amountInput.focus();

        return;
    }



    if (amount > 1000000000000) {
        showMessage(
            "That amount is too large. Please check it.",
            "error"
        );

        amountInput.focus();

        return;
    }


    if (!date || !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
        showMessage(
            "Please choose a valid date.",
            "error"
        );

        transactionDateInput.focus();

        return;
    }



    const transactionData = {
        description: description,
        amount: Math.round(amount * 100) / 100,
        type: type,
        category: category,
        date: date
    };



    const wasEditing = editingTransactionId !== null;


    if (wasEditing) {

        transactions = transactions.map(function (transaction) {
            if (transaction.id === editingTransactionId) {
                return {
                    ...transaction,
                    ...transactionData
                };
            }

            return transaction;
        });

    } else {
        // Create a new transaction with its own ID.
        const newTransaction = {
            id: createId(),
            ...transactionData
        };

        transactions.push(newTransaction);
    }

    saveTransactions();

    updateCategoryFilterOptions();

    updateSummary();

    updateMonthlyReport();

    resetTransactionForm();

    displayTransactions();


    if (wasEditing) {
        showMessage(
            "Transaction updated successfully.",
            "success"
        );
    } else {
        showMessage(
            "Transaction added successfully.",
            "success"
        );
    }
});

cancelEditButton.addEventListener("click", function () {
    resetTransactionForm();

    showMessage("Editing cancelled.");
});



typeInput.addEventListener("change", function () {
    updateCategoryOptions();
});

transactionFilter.addEventListener("change", function () {
    displayTransactions();
});

categoryFilter.addEventListener("change", function () {
    displayTransactions();
});

searchInput.addEventListener("input", function () {
    displayTransactions();
});

reportMonthInput.addEventListener("change", function () {
    updateMonthlyReport();
});

function escapeCsvCell(value) {
    const text = String(value ?? "");

    return `"${text.replace(/"/g, '""')}"`;
}


function exportTransactionsToCsv() {
    if (transactions.length === 0) {
        showMessage(
            "Add a transaction before exporting.",
            "error"
        );

        return;
    }


    const headers = [
        "Description",
        "Amount",
        "Type",
        "Category",
        "Date"
    ];



    const rows = transactions.map(function (transaction) {
        return [
            transaction.description,
            getValidAmount(transaction).toFixed(2),
            transaction.type,
            getCategoryLabel(transaction.category),
            transaction.date
        ];
    });



    const csvText = [headers, ...rows]
        .map(function (row) {
            return row.map(escapeCsvCell).join(",");
        })
        .join("\r\n");



    const blob = new Blob(
        ["\uFEFF", csvText],
        {
            type: "text/csv;charset=utf-8;"
        }
    );

    const downloadUrl = URL.createObjectURL(blob);

    const link = document.createElement("a");

    link.href = downloadUrl;

    link.download = "expense-transactions.csv";

    document.body.appendChild(link);

    link.click();

    link.remove();

    URL.revokeObjectURL(downloadUrl);

    showMessage("CSV export started.", "success");
}


exportButton.addEventListener("click", function () {
    exportTransactionsToCsv();
});


reportMonthInput.value = getTodayDate().slice(0, 7);


transactionDateInput.value = getTodayDate();


updateCategoryOptions();

updateCategoryFilterOptions();

updateSummary();

updateMonthlyReport();

displayTransactions();