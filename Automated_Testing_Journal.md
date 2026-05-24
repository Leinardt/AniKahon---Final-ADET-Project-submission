# GROUP LABORATORY ACTIVITY: AUTOMATED SOFTWARE TESTING AND QA
**Project Title:** AniKahon (Online Catalog for Handcrafted Accessories)  
**Subject:** Software Testing and Quality Assurance (CS/IT Course)  
**Submission Format:** Option 1 — GitHub Repository / Option 2 — Google Classroom Upload  

---

## 1. Group Information

*   **Group Name:** Team QA Accessorizers
*   **Project Title:** AniKahon (Django-React E-Commerce Application)
*   **Group Leader:** ALCOVINDAS, NYAN JEAN Q.
*   **Members & Assigned Contributions:**
    *   **ALCOVINDAS, NYAN JEAN Q. (Member 1):** Configured Django authentication testing modules, validated email-or-username parsing, and tested registration cart auto-generation.
    *   **DELOS REYES, LANCE CHRISTOPHER T. (Member 2):** Developed cart quantity limit testing, out-of-stock validation scripts, and automated quantity threshold updates.
    *   **OMADTO, LEINARDT R. (Member 3):** Wrote advanced voucher rule verification tests covering capping calculations, payment method constraints, and first-purchase-only guards.
    *   **PANCHO, RHONA MAE R. (Member 4):** Created order checkout transaction sequences, database stock decrement assertions, and stock rollback cancellation procedures.

---

## 2. Testing Details Per Member

| Member Name | Assigned Feature | Type of Test | Tool/Framework Used |
| :--- | :--- | :--- | :--- |
| **ALCOVINDAS, NYAN JEAN Q.** | Auth: Registration & Login | Integration / API Testing | Django Test Framework (Python) |
| **DELOS REYES, LANCE CHRISTOPHER T.** | Cart: Add, Update, & Remove | Integration / API Testing | Django Test Framework (Python) |
| **OMADTO, LEINARDT R.** | Vouchers: Calculations & Bounds | Integration / API Testing | Django Test Framework (Python) |
| **PANCHO, RHONA MAE R.** | Orders: Checkout & Cancel | Integration / API Testing | Django Test Framework (Python) |

*Note: For the application of multiple testing frameworks (extra merit criteria), we have also included Jest unit tests (`Login.test.js`) and a headless Selenium E2E script (`e2e_test_flow.py`).*

---

## 3. Test Scenario Documentation

### MEMBER 1: ALCOVINDAS, NYAN JEAN Q. (Authentication & Account Validation)

#### Test Scenario 1: User Account Registration Validation
*   **Functionality Tested:** User Registration (`/api/register/`)
*   **Objective of the Test:** Verify that successful registration adds a user to the database and automatically instantiates a new empty `Cart` record linked to the user.
*   **Steps/Procedure:**
    1. Send a `POST` request to `/api/register/` with a payload of user details.
    2. Verify that the response returns status code `201 Created`.
    3. Assert the user record exists in the database.
    4. Assert that a `Cart` object with the matching `UserID` was created automatically.
*   **Test Data/Input:**
    ```json
    {
      "firstName": "John",
      "lastName": "Doe",
      "username": "johndoe",
      "password": "mypassword123",
      "email": "john@example.com",
      "contactNum": "09998887777",
      "address": "456 Main St, Quezon City"
    }
    ```
*   **Expected Result:** HTTP Status code `201 Created`. A User record is created, and a Cart record is created linking to the user.
*   **Actual Result:** HTTP Status code `201 Created`. User and Cart objects successfully verified in the test database.
*   **Status:** **PASSED**
*   **Evidence / Output Logs:**
    ```
    api/tests/test_alcovindas_registration.py::AlcovindasRegistrationTests::test_user_registration PASSED
    ```

#### Test Scenario 2: User Login Credential Validation
*   **Functionality Tested:** User Login (`/api/login/`)
*   **Objective of the Test:** Verify that users can log in using either their username or email, and that invalid credentials return correct error codes (400 for wrong password, 404 for non-existent user).
*   **Steps/Procedure:**
    1. Send POST request with registered username and correct password. Check status `200 OK`.
    2. Send POST request with registered email and correct password. Check status `200 OK`.
    3. Send POST request with incorrect password. Check status `400 Bad Request`.
    4. Send POST request with a non-existent email/username. Check status `404 Not Found`.
*   **Test Data/Input:**
    *   *Input A:* Username `janesmith`, Password `securepassword123`
    *   *Input B:* Email `jane@example.com`, Password `securepassword123`
    *   *Input C:* Username `janesmith`, Password `wrongpassword`
    *   *Input D:* Username `ghostuser`, Password `somepassword`
*   **Expected Result:** Inputs A & B return `200 OK`. Input C returns `400 Bad Request` with error `"Invalid password"`. Input D returns `404 Not Found` with error `"User not found"`.
*   **Actual Result:** All statuses and error strings matched the expected values exactly.
*   **Status:** **PASSED**
*   **Evidence / Output Logs:**
    ```
    api/tests/test_alcovindas_login.py::AlcovindasLoginTests::test_user_login PASSED
    ```

---

### MEMBER 2: DELOS REYES, LANCE CHRISTOPHER T. (Cart CRUD Transactions & Stock Bounds)

#### Test Scenario 3: Add to Cart Stock Constraint Validation
*   **Functionality Tested:** Add to Cart (`/api/cart/add/`)
*   **Objective of the Test:** Verify that adding items to the cart honors database stock limits (e.g. blocking out-of-stock items, preventing cart quantities from exceeding available stock).
*   **Steps/Procedure:**
    1. Attempt to add an out-of-stock product to the cart. Check status `400 Bad Request` and error `"Out of stock"`.
    2. Add an in-stock product successfully with quantity `2`. Check status `200 OK` and verify a `CartItem` is saved.
    3. Attempt to add more units of that product than are available in stock. Check status `400 Bad Request`.
*   **Test Data/Input:**
    *   *Input A (OOS Product):* `productID` of Tulip (Stock = 0), `quantity: 1`
    *   *Input B (Valid):* `productID` of Sunflower (Stock = 5), `quantity: 2`
    *   *Input C (Excess):* `productID` of Sunflower, `quantity: 4` (makes total 6, exceeding stock limit of 5)
*   **Expected Result:** Out-of-stock requests block immediately with error `"Out of stock"`. Valid additions create a database entry. Over-limit requests return `400 Bad Request`.
*   **Actual Result:** Out-of-stock items were blocked, valid cart additions succeeded, and excess requests were blocked with a stock limit error.
*   **Status:** **PASSED**
*   **Evidence / Output Logs:**
    ```
    api/tests/test_delosreyes_add_to_cart.py::DelosReyesAddToCartTests::test_add_to_cart PASSED
    ```

#### Test Scenario 4: Update Cart Quantity and Item Deletion Threshold
*   **Functionality Tested:** Update Cart Item (`/api/cart/item/<id>/`)
*   **Objective of the Test:** Verify that cart item quantities can be modified up to available stock, and setting the quantity to `0` or less deletes the item from the cart.
*   **Steps/Procedure:**
    1. Update cart item quantity to `3` (valid stock). Verify status `200 OK`.
    2. Update quantity to `10` (exceeds stock). Verify status `400 Bad Request`.
    3. Update quantity to `0`. Verify status `200 OK` and check that the item is deleted from the database.
*   **Test Data/Input:**
    *   *Input A:* `quantity: 3`
    *   *Input B:* `quantity: 10`
    *   *Input C:* `quantity: 0`
*   **Expected Result:** Quantity `3` updates DB. Quantity `10` throws 400. Quantity `0` deletes the CartItem and returns `"Item removed"`.
*   **Actual Result:** Cart items successfully updated or removed from the database based on the quantity thresholds.
*   **Status:** **PASSED**
*   **Evidence / Output Logs:**
    ```
    api/tests/test_delosreyes_update_remove.py::DelosReyesUpdateRemoveTests::test_update_and_remove_cart_item PASSED
    ```

---

### MEMBER 3: OMADTO, LEINARDT R. (Voucher Logic & Capped Discounts)

#### Test Scenario 5: Voucher Discount Value Calculation & Capping
*   **Functionality Tested:** Apply Voucher (`/api/voucher/apply/`)
*   **Objective of the Test:** Verify percentage and fixed-value voucher calculations, ensuring percentage discounts are capped at the maximum allowed amount.
*   **Steps/Procedure:**
    1. Apply percentage voucher `SUMMER20` (20% off, cap = 150 PHP) with a subtotal of 600 PHP. Verify discount equals 120 PHP.
    2. Apply percentage voucher `SUMMER20` with subtotal of 1000 PHP. Verify discount is capped at 150 PHP.
    3. Apply flat voucher `COD100` (flat 100 PHP off) with subtotal of 500 PHP. Verify discount equals 100 PHP.
*   **Test Data/Input:**
    *   *Input A:* Code `"SUMMER20"`, `subtotal: 600.00`
    *   *Input B:* Code `"SUMMER20"`, `subtotal: 1000.00`
    *   *Input C:* Code `"COD100"`, `subtotal: 500.00`, `payment_method: "cod"`
*   **Expected Result:** Input A discount is 120.00. Input B discount is capped at 150.00. Input C discount is 100.00.
*   **Actual Result:** Calculated and capped discount values matched all expected mathematical boundaries.
*   **Status:** **PASSED**
*   **Evidence / Output Logs:**
    ```
    api/tests/test_omadto_voucher_calc.py::OmadtoVoucherCalcTests::test_apply_voucher_discount_calculation PASSED
    ```

#### Test Scenario 6: Voucher Eligibility Constraints Validation
*   **Functionality Tested:** Apply Voucher (`/api/voucher/apply/`)
*   **Objective of the Test:** Verify that vouchers block application when minimum purchase, payment method (COD vs Pickup), or first-purchase-only rules are violated.
*   **Steps/Procedure:**
    1. Apply `SUMMER20` (minimum purchase = 500) with a subtotal of 400. Check for `400 Bad Request`.
    2. Apply `COD100` (COD only) with `payment_method: "pickup"`. Check for `400 Bad Request`.
    3. Place an order, then apply first-purchase-only voucher `NEWUSER`. Check for `400 Bad Request`.
*   **Test Data/Input:**
    *   *Input A:* Code `"SUMMER20"`, `subtotal: 400.00`
    *   *Input B:* Code `"COD100"`, `subtotal: 400.00`, `payment_method: "pickup"`
    *   *Input C:* Code `"NEWUSER"`, `subtotal: 200.00` (Applied after database registers a previous order for the user)
*   **Expected Result:** All three attempts fail with `400 Bad Request` and descriptive validation error messages.
*   **Actual Result:** Rejection criteria verified; error messages were matched.
*   **Status:** **PASSED**
*   **Evidence / Output Logs:**
    ```
    api/tests/test_omadto_voucher_eligibility.py::OmadtoVoucherEligibilityTests::test_apply_voucher_eligibility_constraints PASSED
    ```

---

### MEMBER 4: PANCHO, RHONA MAE R. (Orders & Inventory Integrity)

#### Test Scenario 7: Order Placement Database Lifecycle Transaction
*   **Functionality Tested:** Place Order (`/api/orders/place/`)
*   **Objective of the Test:** Verify that placing an order correctly decrements product inventory, increments voucher usage counts, and empties checkout items from the active cart.
*   **Steps/Procedure:**
    1. Send a POST request to `/api/orders/place/` containing user ID, item details (2 units of `Crochet Daisy Earrings`), applied voucher ID, and cart item IDs to delete.
    2. Check response status is `201 Created`.
    3. Assert product stock quantity has decremented by 2.
    4. Assert voucher `UsedCount` has incremented by 1.
    5. Assert the items are deleted from the active cart.
*   **Test Data/Input:**
    ```json
    {
      "userID": 3,
      "items": [
        { "productID": 1, "quantity": 2, "unitPrice": 150.00 }
      ],
      "paymentType": "COD",
      "total": 250.00,
      "discount": 50.00,
      "voucherID": 1,
      "deliveryAddress": "456 Daisy Rd, Taguig",
      "cartItemIDs": [12]
    }
    ```
*   **Expected Result:** Response status `201 Created`. Product stock drops from 10 to 8. Voucher usage increases from 0 to 1. CartItem is deleted.
*   **Actual Result:** Inventory was decremented, voucher count updated, and cart item cleared from the active database.
*   **Status:** **PASSED**
*   **Evidence / Output Logs:**
    ```
    api/tests/test_pancho_order_place.py::PanchoOrderPlaceTests::test_place_order_decrement_stock_clear_cart PASSED
    ```

#### Test Scenario 8: Order Cancellation Stock Restoration Lifecycle
*   **Functionality Tested:** Cancel Order (`/api/orders/<id>/cancel/`)
*   **Objective of the Test:** Verify that canceling a pending order changes its status to "Cancelled" and automatically restores the associated product quantities back to inventory.
*   **Steps/Procedure:**
    1. Create an Order in the "To Pay" state with 2 units of `Crochet Daisy Earrings` (Stock drops from 10 to 8).
    2. Send a PUT request to the cancellation endpoint `/api/orders/<id>/cancel/`.
    3. Verify status is `200 OK` and message is `"Order cancelled"`.
    4. Assert order status is `"Cancelled"`.
    5. Assert product stock is restored back to its original value (`10`).
*   **Test Data/Input:** URL: `/api/orders/1/cancel/` (PUT request)
*   **Expected Result:** Status `200 OK`. Order status field set to `"Cancelled"`. Product stock increases from 8 to 10.
*   **Actual Result:** Order cancelled successfully and stock was restored back to 10.
*   **Status:** **PASSED**
*   **Evidence / Output Logs:**
    ```
    api/tests/test_pancho_order_cancel.py::PanchoOrderCancelTests::test_cancel_order_restore_stock PASSED
    ```

---

## 4. Reflection / Findings

### Issues encountered
1.  **CSRF Middleware Interception**: Django's built-in CSRF protection blocked external test clients during automated POST and PUT requests, leading to failed test execution.
2.  **React Router v7 Module Resolution**: When implementing frontend unit tests, React Scripts' default Jest configuration failed to resolve the ESM package structure of the newly upgraded React Router library.

### Warnings/errors detected
1.  **MariaDB Strict Mode Warning**: Django's automated checks printed warning `(mysql.W002) MariaDB Strict Mode is not set for database connection 'default'`, advising that strict mode is required to prevent silent truncation.
2.  **JSDOM Reference Error**: The React Jest test run crashed with `ReferenceError: TextEncoder is not defined` because Node's text encoders are not attached to jsdom's global object.

### Bugs discovered
1.  **Cart Quantity Boundary Leak**: During cart update testing, we discovered that setting the cart quantity to `0` or negative values did not delete the cart entry, resulting in dead/corrupted database records.
2.  **Voucher Payment Condition Escape**: We found that vouchers restricted to a specific payment type (e.g., COD only) did not validate correctly when the API request payload omitted the payment type parameter.

### Improvements made after testing
1.  **Cart CRUD Quantities Automatic Cleanup**: Refined the `update_cart_item` view logic so that if the quantity of a cart item is set to `0` or below, the backend automatically performs a database delete instead of a save.
2.  **Voucher Payment Parameter Defending**: Updated the voucher calculation script to fall back to a default value of `'both'` when a payment method is not supplied in the API body, closing validation bypass loopholes.
3.  **JSDOM Global Polyfill Addition**: Added Node's `util.TextEncoder` and `util.TextDecoder` global definitions inside `setupTests.js` to clear environment runtime errors.
4.  **Jest Module Mapping Configuration**: Modified `package.json` to map ESM imports to precompiled CommonJS files, enabling Jest to execute successfully.

### Lessons learned from automation testing
1.  **Test Isolation and Stability**: Running database tests inside isolated transactions that roll back automatically guarantees that test suites run reliably without polluting the actual application data.
2.  **Defensive Edge Case Validation**: Automated tests proved that asserting bad inputs (400 Bad Request, 404 Not Found) is just as critical as testing success states (200 OK) for QA.
3.  **Speed and Repeatability**: Executing regression suites automatically takes seconds compared to minutes of manual browser navigation, making quality assurance faster and more repeatable.

---

## 5. How to Run the Tests

### A. Run Backend Django API Tests (Framework 1)
Make sure you are in the `backend/` folder, activate the virtual environment (`.venv\Scripts\activate` on Windows), and run the tests.

#### Option 1: Run with Pytest (Recommended for beautiful, verbose, green-colored output with percentages)
We have configured `pytest` and `pytest-django`. You can run tests with simple, elegant commands:

*   **To Run All 8 Tests Together:**
    ```powershell
    pytest -v
    ```
    *Output will display a clean, green `PASSED` layout from `[12%]` to `[100%]`!*

*   **To Run Specific Member Tests Individually (For single screenshot evidence):**
    *   *Member 1:*
        ```powershell
        pytest api/tests/test_alcovindas_registration.py -v
        pytest api/tests/test_alcovindas_login.py -v
        ```
    *   *Member 2:*
        ```powershell
        pytest api/tests/test_delosreyes_add_to_cart.py -v
        pytest api/tests/test_delosreyes_update_remove.py -v
        ```
    *   *Member 3:*
        ```powershell
        pytest api/tests/test_omadto_voucher_calc.py -v
        pytest api/tests/test_omadto_voucher_eligibility.py -v
        ```
    *   *Member 4:*
        ```powershell
        pytest api/tests/test_pancho_order_place.py -v
        pytest api/tests/test_pancho_order_cancel.py -v
        ```

#### Option 2: Run with Standard Django Test Runner (Alternative)
If you prefer Django's built-in command line output:

*   **To Run All 8 Tests Together:**
    ```powershell
    python manage.py test api
    ```

*   **To Run Specific Member Tests Individually:**
    *   *Member 1:*
        ```powershell
        python manage.py test api.tests.test_alcovindas_registration
        python manage.py test api.tests.test_alcovindas_login
        ```
    *   *Member 2:*
        ```powershell
        python manage.py test api.tests.test_delosreyes_add_to_cart
        python manage.py test api.tests.test_delosreyes_update_remove
        ```
    *   *Member 3:*
        ```powershell
        python manage.py test api.tests.test_omadto_voucher_calc
        python manage.py test api.tests.test_omadto_voucher_eligibility
        ```
    *   *Member 4:*
        ```powershell
        python manage.py test api.tests.test_pancho_order_place
        python manage.py test api.tests.test_pancho_order_cancel
        ```

### B. Run Frontend Jest Unit Tests (Framework 2)
Make sure you are in the `frontend/` folder and run:
```bash
npm test -- --watchAll=false
```
All suites (including `Login.test.js` and `App.test.js`) should pass.

### C. Run E2E Selenium Test Script (Framework 3)
Ensure the backend is running (`python manage.py runserver`) and the frontend is running (`npm start`). Install selenium and run the script from the root workspace:
```bash
pip install selenium
python e2e_test_flow.py
```
Check the generated `screenshots/` directory for execution evidence.
