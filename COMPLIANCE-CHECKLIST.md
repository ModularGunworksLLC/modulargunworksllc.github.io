# Federal Firearms Compliance Checklist
## Modular Gunworks LLC - FFL Transfer & Gunsmith Services

**Status**: Review & Implementation Required  
**Last Updated**: December 2024  
**Regulatory Framework**: 18 USC § 922, 27 CFR Parts 447, 478, 479

---

## CRITICAL COMPLIANCE REQUIREMENTS

### 1. AGE RESTRICTION NOTICES ⚠️ MISSING
**Federal Requirement**: 18 USC § 922(b)(1)(B)
- **Handguns**: Must be 21+ years old
- **Rifles/Shotguns**: Must be 18+ years old

**Current Status**: ❌ NOT DISPLAYED
**Where Required**:
- [ ] FFL Transfers page (header/banner)
- [ ] Checkout page (before payment)
- [ ] Homepage (prominent banner)
- [ ] Services page

**Implementation**: Add prominent banner:
```
⚠️ AGE VERIFICATION REQUIRED
To purchase firearms through us, you must be:
• 21 years or older for handguns
• 18 years or older for rifles and shotguns
• Legally able to possess firearms in Alabama and your locality
By proceeding, you confirm you meet these requirements.
```

---

### 2. PROHIBITED PERSONS WARNING ⚠️ MISSING
**Federal Requirement**: 18 USC § 922(d) & (g)
**Current Status**: ❌ NOT ON WEBSITE

You **CANNOT** transfer firearms to persons who:
1. Have been convicted of a felony (crime punishable by 1+ years imprisonment)
2. Are a fugitive from justice
3. Are an unlawful user of or addicted to controlled substances
4. Have been adjudicated mentally defective or committed to mental institution
5. Are an illegal alien or admit to being in U.S. unlawfully
6. Have been dishonorably discharged from military
7. Have renounced U.S. citizenship
8. Are subject to restraining order for intimate partner harassment/threats
9. Have been convicted of misdemeanor crime of domestic violence
10. Are under indictment for felony (before conviction)

**Implementation**: Create `/legal/prohibited-persons.html` page with full list
**Display**: Link on checkout, FFL transfers page

---

### 3. NICS BACKGROUND CHECK PROCESS ⚠️ INCOMPLETE
**Federal Requirement**: Brady Act (18 USC § 922(t))
**Current Status**: ⚠️ Mentioned but not fully explained

**Missing Information**:
- [ ] What NICS (National Instant Criminal Background Check System) is
- [ ] Typical processing time: 1-3 business days
- [ ] What happens if check is delayed or denied
- [ ] Customer's rights if denied
- [ ] No payment collected until NICS clears

**Implementation**: Add to checkout and FFL transfers page:
```
FEDERAL BACKGROUND CHECK PROCESS
1. Submit NICS Request: Upon order, we submit your request to FBI's 
   National Instant Criminal Background Check System (NICS)
2. Processing Time: Typically 1-3 business days
3. Possible Results:
   • PROCEED: Transfer can happen immediately
   • DELAYED: Check taking longer (up to 10 days possible)
   • DENIED: FBI found disqualifying information (rare, you can appeal)
4. Payment: You will not be charged until NICS clears
5. Legal Right: You have right to know reason for denial
```

---

### 4. FORM 4473 DISCLOSURE ⚠️ MISSING
**Federal Requirement**: 27 CFR § 478.124
**Current Status**: ❌ NOT MENTIONED

**What customers must know**:
- [ ] They must complete ATF Form 4473 (federal firearms transaction form)
- [ ] The form asks about prohibited person status
- [ ] False statements on the form are federal crimes
- [ ] Form is filed with us, retained per federal requirement
- [ ] Covers both sales and transfers

**Implementation**: Add to checkout page and FFL transfers page:
```
FEDERAL FORM 4473 REQUIREMENT
All firearm transfers require completion of ATF Form 4473 
(Federal Firearms Transaction Record). You will:
• Provide government-issued photo ID
• Answer questions about prohibited person status
• Certify all information is true and accurate
• Understand false statements are federal crimes

This is standard for all FFL transfers nationwide.
```

---

### 5. FFL LICENSE INFORMATION DISPLAY ⚠️ MISSING
**Federal Requirement**: 27 CFR § 478.21
**Current Status**: ❌ NOT DISPLAYED

**Required Information**:
- [ ] FFL License Number
- [ ] License Issue Date
- [ ] License Expiration Date
- [ ] License Type (Type 01 - Dealer)
- [ ] Optionally: ATF verification database link

**Implementation**: Add to footer or "/about" page:
```
FEDERAL FIREARMS LICENSE
Modular Gunworks LLC is a federally licensed firearms dealer (FFL)
License #: [INSERT YOUR NUMBER]
Issued: [DATE]
Expires: [DATE]
License Type: Type 01 - Firearms Dealer
Verify: https://www.atf.gov/firearms/federal-firearms-licenses
```

---

### 6. TERMS OF SERVICE & FIREARMS-SPECIFIC DISCLAIMERS ⚠️ MISSING
**Federal Requirement**: General legal requirement + firearms industry standard
**Current Status**: ❌ NOT CREATED

**Critical Elements**:
- [ ] Age verification and affirmation
- [ ] Legally binding representation that buyer is not prohibited person
- [ ] Acknowledgment of Form 4473 requirement
- [ ] Prohibited uses of firearms (no straw purchases, no illegal modification)
- [ ] No sales to out-of-state residents (with limited exceptions)
- [ ] Alabama state law compliance
- [ ] Limitation of liability
- [ ] Refund policy specific to firearms (NON-REFUNDABLE per industry standard)

**Implementation**: Create `/legal/terms-of-service.html`

---

### 7. PRIVACY POLICY - FIREARMS SPECIFIC ⚠️ MISSING
**Federal Requirement**: 27 CFR § 478.457 (Record Keeping)
**Current Status**: ❌ NOT FIREARMS-SPECIFIC

**Required Disclosures**:
- [ ] What customer data we collect (Name, address, ID, NICS result)
- [ ] How long we retain records (Required by law)
- [ ] Who has access to records (Only us, unless court order)
- [ ] We comply with federal record retention requirements
- [ ] NICS data destruction timeline (per Brady Act)
- [ ] Data protection and security measures

**Implementation**: Create `/legal/privacy-policy-firearms.html` OR update existing policy with firearms section

---

### 8. OUT-OF-STATE SHIPPING RESTRICTIONS ⚠️ MISSING
**Federal Requirement**: 18 USC § 922(a)(3) & (b)
**Current Status**: ❌ NOT CLEARLY STATED

**Law**: Cannot sell/transfer handguns to out-of-state residents
**Can Transfer**: Rifles/shotguns may have limited out-of-state options (rare, complex)

**Implementation**: Add to checkout:
```
STATE RESIDENCY REQUIREMENT
Handgun transfers: YOU MUST BE AN ALABAMA RESIDENT
Rifle/Shotgun transfers: ALABAMA RESIDENT PREFERRED
                        (Out-of-state options may be available in limited cases)
                        
Proof of residency required (ID, utility bill, etc.)
```

---

### 9. NO STRAW PURCHASE LANGUAGE ⚠️ MISSING
**Federal Requirement**: 18 USC § 922(a)(6)
**Current Status**: ❌ NOT ADDRESSED

**Definition**: Buying firearms for someone else ("straw purchase") is federal crime
**Liability**: You could be charged federally

**Implementation**: Add to checkout and Terms:
```
ANTI-STRAW PURCHASE CERTIFICATION
I certify that I am the actual purchaser of this firearm and am
not acquiring it on behalf of any other person. Any straw purchase
is a federal felony and may result in up to 10 years imprisonment.
```

---

### 10. SECURITY DEVICE REQUIREMENT (HANDGUNS) ⚠️ MISSING
**Federal Requirement**: 18 USC § 922(z) - Secure Gun Storage Device
**Current Status**: ❌ NOT MENTIONED

**Law**: As of 2023, handgun sales must include secure gun storage/safety device
**Requirement**: Deliver device within 10 days of handgun delivery

**Implementation**: Add to handgun pricing section:
```
Every handgun transfer includes:
✓ Secure gun storage device (lock case or cable lock)
✓ Safe storage instructions
✓ Delivered with or shortly after handgun transfer
```

---

### 11. BACKGROUND CHECK DELAY PROCEDURES ⚠️ MISSING
**Federal Requirement**: 18 USC § 922(t)(1)(B) - Brady Delay Procedures
**Current Status**: ❌ NOT ADDRESSED

**What Happens**: If NICS can't clear in 3 business days
- [ ] We notify law enforcement in your county
- [ ] Optional 5-day waiting period
- [ ] We may proceed after 10 days if NICS hasn't responded

**Implementation**: Add to checkout page

---

## WEBSITE PAGE COMPLIANCE STATUS

### ✅ COMPLIANT
- [ ] None currently - all pages need work

### ⚠️ PARTIAL COMPLIANCE
- [ffl-transfers.html](ffl-transfers.html) - Has pricing, process overview, but missing legal disclaimers
- [services.html](services.html) - Has service descriptions, missing license display
- [shop/checkout.html](shop/checkout.html) - Has form, missing compliance language

### ❌ NON-COMPLIANT (Missing)
- `/legal/age-restrictions.html` - Age requirements
- `/legal/prohibited-persons.html` - Who can't buy firearms
- `/legal/terms-of-service.html` - Binding legal terms
- `/legal/privacy-policy.html` - Data handling and NICS info
- `/legal/ffl-information.html` - License display and ATF info

---

## IMPLEMENTATION PRIORITY

### PHASE 1 (Critical - Do First)
**Estimated Time**: 2-3 days
1. Add age restriction banners to:
   - FFL transfers page (top)
   - Checkout page (before payment)
   - Homepage (header or prominent section)

2. Create `/legal/prohibited-persons.html` page
3. Add FFL license info to footer
4. Create `/legal/terms-of-service.html`
5. Update checkout with Form 4473 language

### PHASE 2 (High Priority - Do Next)
**Estimated Time**: 2-3 days
1. Create `/legal/privacy-policy.html` (firearms-specific)
2. Expand NICS explanation on checkout and FFL page
3. Add secure gun storage language to handgun pricing
4. Add straw purchase certification to checkout
5. Add state residency requirements

### PHASE 3 (Ongoing)
1. Alabama state law compliance verification
2. Professional legal review (recommend attorney)
3. ATF industry liaison consultation
4. Local Madison County ordinance check
5. Customer privacy policy implementation

---

## LEGAL RESOURCES

**Federal Resources**:
- ATF: https://www.atf.gov/firearms
- 18 USC § 922: https://www.law.cornell.edu/uscode/text/18/922
- 27 CFR Part 478: https://www.atf.gov/rules-and-regulations

**State Resources**:
- Alabama Firearms Laws: https://www.criminaldefense.alabama.gov/
- Madison County Sheriff: Local compliance officer contact

**Professional Help**:
- ATF Industry Liaison: industryliaison@atf.gov
- Recommend: Local firearms attorney review (one-time cost ~$500-1000 for document review)

---

## NOTES

**Important**: This checklist is based on federal law. Alabama may have additional requirements.

**Next Step**: Consult with a firearms attorney to ensure full compliance and have them review your terms of service, privacy policy, and website disclosures.

**Recommendation**: Contact ATF Industry Liaison at industryliaison@atf.gov with any questions about specific requirements for your website.

