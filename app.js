// app.js

// Example: Placeholder functionality
document.addEventListener("DOMContentLoaded", () => {
  console.log("Welcome to Zendea - Where Hustle Meets Harmony.");
  
  const searchButton = document.querySelector(".search-section button");
  const searchInput = document.querySelector(".search-section input[type='search']");
  
  searchButton.addEventListener("click", () => {
    const query = searchInput.value.trim();
    if (query) {
      alert(`You searched for: ${query}`);
      // In the future, connect this to Firebase search or redirect
    } else {
      alert("Please enter something to search.");
    }
  });
});