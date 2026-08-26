import React, { useState } from 'react';
import {
  ArrowRight,
  BadgeIndianRupee,
  Building2,
  Check,
  Info,
  Landmark,
  MapPin,
  ReceiptIndianRupee,
  RotateCcw,
  ShieldCheck,
} from 'lucide-react';
import { calculateDelhiDuty } from '../../utils/stampDuty';
import './StampDutyCalculator.css';

const rupees = new Intl.NumberFormat('en-IN', {
  style: 'currency',
  currency: 'INR',
  maximumFractionDigits: 0,
});

export default function StampDutyCalculator() {
  const [buyer, setBuyer] = useState('woman');
  const [result, setResult] = useState(null);

  const calculate = (event) => {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    setResult(calculateDelhiDuty(
      Number(data.get('consideration')),
      Number(data.get('circleValue')),
      buyer,
    ));
  };

  return (
    <div className="stamp-duty-view animate-fadeIn">
      <header className="stamp-duty-hero">
        <div>
          <span className="stamp-duty-eyebrow"><Landmark size={14} /> Property registration, simplified</span>
          <h2>Know your stamp duty <span>before you sign.</span></h2>
          <p>Answer a few questions to estimate the government charges on your property transaction.</p>
        </div>
        <div className="stamp-duty-trust"><ShieldCheck size={17} /><span><strong>Private calculation</strong>Your details stay on this device</span></div>
      </header>

      <div className="stamp-duty-grid">
        <form className="stamp-duty-form" onSubmit={calculate} onReset={() => { setBuyer('woman'); setResult(null); }}>
          <div className="stamp-duty-card-title">
            <span>01</span>
            <div><h3>Transaction details</h3><p>Fields used for duty or property valuation.</p></div>
          </div>

          <div className="stamp-duty-fields">
            <label>
              State / Union Territory
              <select name="state" defaultValue="delhi">
                <option value="delhi">Delhi</option>
              </select>
              <small>More states will arrive with the rates backend.</small>
            </label>
            <label>
              Transaction type
              <select name="transaction" defaultValue="sale">
                <option value="sale">Sale deed</option>
                <option value="gift">Gift deed</option>
                <option value="conveyance">Conveyance deed</option>
              </select>
            </label>
            <label>
              Property type
              <select name="propertyType" defaultValue="residential">
                <option value="residential">Residential flat / house</option>
                <option value="commercial">Commercial property</option>
                <option value="plot">Residential plot</option>
                <option value="agricultural">Agricultural land</option>
              </select>
            </label>
            <label>
              District / locality
              <span className="stamp-duty-input-icon"><MapPin size={15} /><input name="locality" placeholder="e.g. South Delhi" required /></span>
            </label>
          </div>

          <fieldset className="stamp-duty-buyer">
            <legend>Buyer category</legend>
            <div>
              {[
                ['woman', 'Woman'],
                ['man', 'Man'],
                ['joint', 'Joint / entity'],
              ].map(([value, label]) => (
                <label className={buyer === value ? 'selected' : ''} key={value}>
                  <input type="radio" name="buyer" value={value} checked={buyer === value} onChange={() => setBuyer(value)} />
                  {label}
                </label>
              ))}
            </div>
            <small>Joint ownership uses the standard 6% preview rate until party-share rules are connected.</small>
          </fieldset>

          <div className="stamp-duty-fields">
            <label>
              Sale / consideration amount
              <span className="stamp-duty-input-icon"><BadgeIndianRupee size={15} /><input name="consideration" type="number" inputMode="numeric" min="1" placeholder="e.g. 7500000" required /></span>
            </label>
            <label>
              Government circle-rate value
              <span className="stamp-duty-input-icon"><BadgeIndianRupee size={15} /><input name="circleValue" type="number" inputMode="numeric" min="0" placeholder="Optional if unknown" /></span>
              <small>Duty applies to whichever property value is higher.</small>
            </label>
            <label>
              Property / land area
              <span className="stamp-duty-input-icon"><Building2 size={15} /><input name="area" type="number" min="1" step="any" placeholder="e.g. 1250" required /></span>
            </label>
            <label>
              Area unit
              <select name="areaUnit" defaultValue="sqft">
                <option value="sqft">Square feet</option>
                <option value="sqm">Square metres</option>
                <option value="sqyd">Square yards</option>
                <option value="acre">Acres</option>
                <option value="hectare">Hectares</option>
              </select>
            </label>
          </div>

          <div className="stamp-duty-actions">
            <button type="reset" className="stamp-duty-reset"><RotateCcw size={15} /> Reset</button>
            <button type="submit" className="stamp-duty-submit">Calculate stamp duty <ArrowRight size={16} /></button>
          </div>
        </form>

        <aside className="stamp-duty-result" aria-live="polite">
          {result ? (
            <>
              <div className="stamp-duty-result-heading">
                <span><ReceiptIndianRupee size={20} /></span>
                <div><small>Estimated stamp duty</small><strong>{rupees.format(result.stampDuty)}</strong></div>
              </div>
              <div className="stamp-duty-total">
                <span>Total government charges</span>
                <strong>{rupees.format(result.total)}</strong>
                <small>{result.rate * 100 + 1}% of assessable value + ₹100</small>
              </div>
              <dl className="stamp-duty-breakdown">
                <div><dt>Assessable value</dt><dd>{rupees.format(result.assessableValue)}</dd></div>
                <div><dt>Stamp duty ({result.rate * 100}%)</dt><dd>{rupees.format(result.stampDuty)}</dd></div>
                <div><dt>Registration fee (1% + ₹100)</dt><dd>{rupees.format(result.registrationFee)}</dd></div>
              </dl>
              <div className="stamp-duty-ready"><Check size={15} /> Your estimate is ready.</div>
            </>
          ) : (
            <div className="stamp-duty-empty">
              <span><BadgeIndianRupee size={25} /></span>
              <h3>Your estimate will appear here</h3>
              <p>Complete the property details to see stamp duty and registration charges.</p>
            </div>
          )}

          <div className="stamp-duty-note"><Info size={15} /><p><strong>Estimate, not a payment quote.</strong> This Delhi preview uses published rates for sale, gift and conveyance deeds. Confirm the final amount with the sub-registrar.</p></div>
          <a href="https://revenue.delhi.gov.in/revenue/important-information-regarding-registration-property" target="_blank" rel="noreferrer">View official Delhi guidance ↗</a>
        </aside>
      </div>
    </div>
  );
}
