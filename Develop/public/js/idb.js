let db;
const request = indexedDB.open("budget-tracker", 1);

request.onupgradeneeded = function (event) {
  const db = event.target.result;
  db.createObjectStore("new_billTransaction", { autoIncrement: true });
};

request.onsuccess = function (event) {
  // when db is successfully created with its object store (from onupgradedneeded event above), save reference to db in global variable
  db = event.target.result;

  // check if app is online, if yes run checkDatabase() function to send all local db data to api
  if (navigator.onLine) {
    uploadTransaction();
  }
};

request.onerror = function (event) {
  // log error here
  console.log(event.target.errorCode);
};

function saveRecord(record) {
  const transaction = db.transaction(["new_billTransaction"], "readwrite");

  const TransactionObjectStore = transaction.objectStore("new_billTransaction");

  // add record to your store with add method.
  billTransactionStoree.add(record);
}

function uploadTransaction() {
  // open a transaction on your pending db
  const transaction = db.transaction(["new_billTransaction"], "readwrite");

  // access your pending object store
  const billTransactionStore = transaction.objectStore("new_billTransaction");

  // get all records from store and set to a variable
  const getAll = billTransactionStore.getAll();

  getAll.onsuccess = function () {
    // if there was data in indexedDb's store, let's send it to the api server
    if (getAll.result.length > 0) {
      fetch("/api/transaction/bulk", {
        method: "POST",
        body: JSON.stringify(getAll.result),
        headers: {
          Accept: "application/json, text/plain, */*",
          "Content-Type": "application/json",
        },
      })
        .then((response) => response.json())
        .then((serverResponse) => {
          if (serverResponse.message) {
            throw new Error(serverResponse);
          }

          const transaction = db.transaction(["new_billTransaction"], "readwrite");
          const billTransactionStore = transaction.objectStore("new_billTransaction");
          // clear all items in your store
          billTransactionStore.clear();
        })
        .catch((err) => {
          // set reference to redirect back here
          console.log(err);
        });
    }
  };
}

// listen for app coming back online
window.addEventListener("online", uploadTransaction);
