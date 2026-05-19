import { useState, useRef, useEffect } from 'react';
import { UserPlus, Phone, Loader, Search, User } from 'lucide-react';
import { usePOSStore, type Customer } from '../store/pos-store';
import { Button, Dialog, DialogContent, Input } from './ui';
import { Select, SelectItem } from './ui';
import { ChevronDown } from 'lucide-react';
import React from 'react';
import {
  addCustomer,
  type CreateCustomerData,
  searchCustomers,
  type CustomerSearchResult,
  minCustomerSearchLength,
  isPrimarilyPhoneQuery,
  extractPhoneDigits,
} from '../lib/customer-api';
import { AggregatorSelect } from './AggregatorSelect';
import { t } from '../i18n';
import { cn } from '../lib/utils';

function mapSearchResultToCustomer(row: CustomerSearchResult): Customer {
  return {
    id: row.name,
    name: row.customer_name || row.name,
    phone: row.mobile_number || '',
  };
}

// NewCustomerForm component
function NewCustomerForm({
  onClose,
  onSuccess,
  isCreatingCustomer: parentIsCreatingCustomer,
  setIsCreatingCustomer: setParentIsCreatingCustomer,
  prefillName = '',
  prefillPhone = '',
}: {
  onClose: () => void;
  onSuccess?: () => void;
  isCreatingCustomer?: boolean;
  setIsCreatingCustomer?: React.Dispatch<React.SetStateAction<boolean>>;
  prefillName?: string;
  prefillPhone?: string;
}) {
  const { customerGroups, territories, fetchCustomerGroups, fetchTerritories, setSelectedCustomer } =
    usePOSStore();
  const [newCustomerName, setNewCustomerName] = React.useState('');
  const [newCustomerPhone, setNewCustomerPhone] = React.useState('');
  const [newCustomerGroup, setNewCustomerGroup] = React.useState('');
  const [newCustomerTerritory, setNewCustomerTerritory] = React.useState('');
  const [formError, setFormError] = React.useState(false);
  const [apiError, setApiError] = React.useState<string>('');
  const [loadingGroups, setLoadingGroups] = React.useState(false);
  const [loadingTerritories, setLoadingTerritories] = React.useState(false);

  const [localIsCreatingCustomer, setLocalIsCreatingCustomer] = React.useState(false);
  const isCreatingCustomer = parentIsCreatingCustomer ?? localIsCreatingCustomer;
  const setIsCreatingCustomer = setParentIsCreatingCustomer ?? setLocalIsCreatingCustomer;

  React.useEffect(() => {
    if (prefillName) setNewCustomerName(prefillName);
    if (prefillPhone) setNewCustomerPhone(prefillPhone);
  }, [prefillName, prefillPhone]);

  React.useEffect(() => {
    if (!customerGroups.length) {
      setLoadingGroups(true);
      fetchCustomerGroups().finally(() => setLoadingGroups(false));
    }
    if (!territories.length) {
      setLoadingTerritories(true);
      fetchTerritories().finally(() => setLoadingTerritories(false));
    }
  }, []);

  async function handleAddCustomerSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!newCustomerName || !newCustomerPhone) {
      setFormError(true);
      return;
    }

    setFormError(false);
    setApiError('');
    setIsCreatingCustomer(true);

    try {
      const customerData: CreateCustomerData = {
        customer_name: newCustomerName.trim(),
        mobile_number: newCustomerPhone.trim(),
      };
      if (newCustomerGroup) customerData.customer_group = newCustomerGroup;
      if (newCustomerTerritory) customerData.territory = newCustomerTerritory;

      const response = await addCustomer(customerData);
      const created = response.data;
      setSelectedCustomer({
        id: created.name || created.customer_name,
        name: created.customer_name,
        phone: created.mobile_number,
      });
      setNewCustomerName('');
      setNewCustomerPhone('');
      setNewCustomerGroup('');
      setNewCustomerTerritory('');
      onSuccess?.();
      onClose();
    } catch (error: unknown) {
      console.error('Failed to create customer:', error);
      setApiError(error instanceof Error ? error.message : t('customer.failed_create'));
    } finally {
      setIsCreatingCustomer(false);
    }
  }

  return (
    <form className="space-y-4" onSubmit={handleAddCustomerSubmit}>
      {apiError && (
        <div className="bg-red-50 border border-red-200 rounded-md p-3">
          <div className="text-sm text-red-600">{apiError}</div>
        </div>
      )}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="new-customer-name">
          {t('customer.name_label')} <span className="text-red-500">*</span>
        </label>
        <Input
          id="new-customer-name"
          type="text"
          value={newCustomerName}
          onChange={(e) => setNewCustomerName(e.target.value)}
          required
          disabled={isCreatingCustomer}
          aria-invalid={!!formError && !newCustomerName}
        />
        {formError && !newCustomerName && (
          <div className="text-xs text-red-500 mt-1">{t('customer.name_required')}</div>
        )}
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="new-customer-phone">
          {t('customer.phone_label')} <span className="text-red-500">*</span>
        </label>
        <div className="relative">
          <Input
            id="new-customer-phone"
            type="tel"
            value={newCustomerPhone}
            onChange={(e) => setNewCustomerPhone(e.target.value)}
            required
            disabled={isCreatingCustomer}
            className="pl-10"
            aria-invalid={!!formError && !newCustomerPhone}
          />
          <Phone className="absolute left-3 top-2.5 text-gray-400 w-5 h-5" />
        </div>
        {formError && !newCustomerPhone && (
          <div className="text-xs text-red-500 mt-1">{t('customer.phone_required')}</div>
        )}
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          {t('customer.customer_group_label')}
        </label>
        <Select
          placeholder={loadingGroups ? t('common.loading') : t('customer.select_group')}
          value={newCustomerGroup}
          onValueChange={setNewCustomerGroup}
          disabled={isCreatingCustomer || loadingGroups || !customerGroups.length}
        >
          {customerGroups.map((group) => (
            <SelectItem key={group} value={group} className="capitalize">
              {group}
            </SelectItem>
          ))}
        </Select>
        {!loadingGroups && !customerGroups.length && (
          <div className="text-xs text-gray-400 mt-1">{t('common.no_options')}</div>
        )}
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">{t('customer.territory_label')}</label>
        <Select
          placeholder={loadingTerritories ? t('common.loading') : t('customer.select_territory')}
          value={newCustomerTerritory}
          onValueChange={setNewCustomerTerritory}
          disabled={isCreatingCustomer || loadingTerritories || !territories.length}
        >
          {territories.map((territory) => (
            <SelectItem key={territory} value={territory} className="capitalize">
              {territory}
            </SelectItem>
          ))}
        </Select>
        {!loadingTerritories && !territories.length && (
          <div className="text-xs text-gray-400 mt-1">{t('common.no_options')}</div>
        )}
      </div>
      <div className="flex gap-3 mt-6">
        <Button type="submit" variant="default" className="flex-1" disabled={isCreatingCustomer}>
          {isCreatingCustomer ? (
            <>
              <Loader className="w-4 h-4 mr-2 animate-spin" />
              {t('customer.adding')}
            </>
          ) : (
            t('customer.add_button')
          )}
        </Button>
        <Button type="button" variant="outline" onClick={onClose} disabled={isCreatingCustomer}>
          {t('common.cancel')}
        </Button>
      </div>
    </form>
  );
}

interface CustomerSelectProps {
  disabled?: boolean;
}

export function CustomerSelect({ disabled }: CustomerSelectProps) {
  const { selectedCustomer, setSelectedCustomer, selectedOrderType, isUpdatingOrder } =
    usePOSStore();
  const [showNewCustomerForm, setShowNewCustomerForm] = useState(false);
  const [isCreatingCustomer, setIsCreatingCustomer] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState<number>(-1);
  const [searchResults, setSearchResults] = useState<CustomerSearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const [prefillName, setPrefillName] = useState('');
  const [prefillPhone, setPrefillPhone] = useState('');

  const trimmedSearch = searchTerm.trim();
  const minLen = trimmedSearch ? minCustomerSearchLength(trimmedSearch) : 0;
  const effectiveLen = trimmedSearch
    ? isPrimarilyPhoneQuery(trimmedSearch)
      ? extractPhoneDigits(trimmedSearch).length
      : trimmedSearch.length
    : 0;
  const needsMoreChars = trimmedSearch.length > 0 && effectiveLen < minLen;

  useEffect(() => {
    if (!isOpen || !trimmedSearch) {
      setSearchResults([]);
      setSearchError(null);
      setIsSearching(false);
      return;
    }
    if (needsMoreChars) {
      setSearchResults([]);
      setSearchError(null);
      setIsSearching(false);
      return;
    }

    setIsSearching(true);
    setSearchError(null);
    const handler = setTimeout(() => {
      searchCustomers(trimmedSearch, 12)
        .then((results) => {
          setSearchResults(results);
          setIsSearching(false);
        })
        .catch(() => {
          setSearchError(t('customer.failed_search'));
          setIsSearching(false);
        });
    }, 280);
    return () => clearTimeout(handler);
  }, [trimmedSearch, isOpen, needsMoreChars]);

  const selectCustomer = (row: CustomerSearchResult) => {
    setSelectedCustomer(mapSearchResultToCustomer(row));
    setSearchTerm('');
    setIsOpen(false);
    setHighlightedIndex(-1);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    const totalOptions = searchResults.length + 1;
    if (!isOpen && (e.key === 'ArrowDown' || e.key === 'ArrowUp')) {
      setIsOpen(true);
      setHighlightedIndex(0);
      return;
    }
    if (e.key === 'ArrowDown') {
      setHighlightedIndex((prev) => Math.min(prev + 1, totalOptions - 1));
      e.preventDefault();
    } else if (e.key === 'ArrowUp') {
      setHighlightedIndex((prev) => Math.max(prev - 1, 0));
      e.preventDefault();
    } else if (e.key === 'Enter') {
      if (!isOpen || needsMoreChars) return;
      if (highlightedIndex === searchResults.length) {
        openNewCustomerForm();
      } else if (searchResults[highlightedIndex]) {
        selectCustomer(searchResults[highlightedIndex]);
      }
      e.preventDefault();
    } else if (e.key === 'Escape') {
      setIsOpen(false);
    }
  };

  const openNewCustomerForm = () => {
    if (/^[\d\s\-+().]+$/.test(trimmedSearch) && extractPhoneDigits(trimmedSearch).length >= 3) {
      setPrefillPhone(trimmedSearch);
      setPrefillName('');
    } else {
      setPrefillName(trimmedSearch);
      setPrefillPhone('');
    }
    setShowNewCustomerForm(true);
    setIsOpen(false);
  };

  if (selectedOrderType === 'Aggregators') {
    return <AggregatorSelect />;
  }

  const phoneMode = isPrimarilyPhoneQuery(trimmedSearch);

  return (
    <div className="relative">
      {selectedCustomer ? (
        <div className="flex items-center justify-between bg-blue-50 p-3 rounded-lg border border-blue-100">
          <div className="min-w-0 flex-1">
            <p className="font-medium text-blue-900 truncate">{selectedCustomer.name}</p>
            {selectedCustomer.phone && (
              <p className="text-sm text-blue-700 flex items-center gap-1 mt-0.5">
                <Phone className="w-3.5 h-3.5 shrink-0" />
                <span className="tabular-nums">{selectedCustomer.phone}</span>
              </p>
            )}
          </div>
          <Button
            onClick={() => {
              setSelectedCustomer(null);
              setTimeout(() => inputRef.current?.focus(), 0);
            }}
            disabled={disabled || isUpdatingOrder}
            variant="ghost"
            size="sm"
            className="text-blue-700 hover:text-blue-800 shrink-0"
          >
            {t('common.change')}
          </Button>
        </div>
      ) : (
        <div className="relative">
          <div className="flex items-center relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
            <input
              ref={inputRef}
              type="search"
              inputMode={phoneMode ? 'tel' : 'search'}
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setIsOpen(true);
                setHighlightedIndex(0);
              }}
              onFocus={() => setIsOpen(true)}
              onBlur={() => setTimeout(() => setIsOpen(false), 150)}
              onKeyDown={handleKeyDown}
              disabled={disabled}
              placeholder={t('customer.search_placeholder')}
              className={cn(
                'w-full h-10 border border-gray-200 rounded-lg pl-9 pr-9 py-2 text-sm',
                'text-gray-700 shadow-sm focus:outline-none focus:ring-2 focus:ring-primary-500',
                'disabled:opacity-50 disabled:cursor-not-allowed'
              )}
              aria-label={t('customer.search_placeholder')}
              autoComplete="off"
            />
            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
          </div>
          <p className="mt-1 text-[11px] text-gray-500">{t('customer.search_hint')}</p>

          {isOpen && (
            <div className="absolute w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-50 max-h-80 overflow-y-auto">
              {!trimmedSearch && (
                <div className="p-3 text-center text-gray-400 text-sm">{t('customer.type_to_search')}</div>
              )}
              {needsMoreChars && (
                <div className="p-3 text-center text-gray-500 text-sm">
                  {phoneMode
                    ? t('customer.type_more_digits', { count: String(minLen) })
                    : t('customer.type_more_chars', { count: String(minLen) })}
                </div>
              )}
              {isSearching && (
                <div className="flex items-center justify-center p-4 text-gray-500 text-sm">
                  <Loader className="w-4 h-4 mr-2 animate-spin" />
                  {t('common.searching')}
                </div>
              )}
              {searchError && (
                <div className="p-4 text-center text-red-500 text-sm">{searchError}</div>
              )}
              {!isSearching &&
                !searchError &&
                !needsMoreChars &&
                searchResults.map((customer, idx) => (
                  <button
                    key={customer.name}
                    type="button"
                    className={cn(
                      'w-full px-3 py-2.5 text-left border-b border-gray-50 last:border-0 transition-colors',
                      idx === highlightedIndex ? 'bg-primary-50' : 'hover:bg-gray-50'
                    )}
                    onMouseDown={() => selectCustomer(customer)}
                    onMouseEnter={() => setHighlightedIndex(idx)}
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <User className="w-4 h-4 text-gray-400 shrink-0" />
                      <div className="min-w-0 flex-1">
                        <div className="font-medium text-sm text-gray-900 truncate">
                          {customer.customer_name || customer.name}
                        </div>
                        {customer.mobile_number && (
                          <div className="flex items-center gap-1 text-xs text-gray-500 mt-0.5">
                            <Phone className="w-3 h-3 shrink-0" />
                            <span className="tabular-nums">{customer.mobile_number}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </button>
                ))}
              {!isSearching &&
                !searchError &&
                !needsMoreChars &&
                trimmedSearch &&
                searchResults.length === 0 && (
                  <div className="p-4 text-center text-gray-400 text-sm">
                    {t('customer.no_customers_found')}
                  </div>
                )}
              {trimmedSearch && !needsMoreChars && (
                <>
                  <div className="my-1 h-px bg-gray-100" />
                  <button
                    type="button"
                    className={cn(
                      'flex items-center gap-2 w-full px-4 py-2.5 text-primary-600 hover:bg-gray-50 font-medium text-sm',
                      highlightedIndex === searchResults.length && 'bg-primary-50'
                    )}
                    onMouseDown={openNewCustomerForm}
                    onMouseEnter={() => setHighlightedIndex(searchResults.length)}
                  >
                    <UserPlus className="w-4 h-4 shrink-0" />
                    <span className="truncate">
                      {trimmedSearch
                        ? t('customer.add_with_name', { name: trimmedSearch })
                        : t('customer.add_new')}
                    </span>
                  </button>
                </>
              )}
            </div>
          )}
        </div>
      )}
      {showNewCustomerForm && (
        <Dialog
          open={showNewCustomerForm}
          onOpenChange={(open) => {
            if (!isCreatingCustomer) setShowNewCustomerForm(open);
          }}
        >
          <DialogContent className="w-full max-w-md p-4 max-h-[80vh] overflow-y-auto">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              {t('customer.add_customer_title')}
            </h3>
            <NewCustomerForm
              onClose={() => setShowNewCustomerForm(false)}
              isCreatingCustomer={isCreatingCustomer}
              setIsCreatingCustomer={setIsCreatingCustomer}
              prefillName={prefillName}
              prefillPhone={prefillPhone}
            />
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
